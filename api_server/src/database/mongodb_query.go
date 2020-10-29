//+build !test

package database

import (
	"errors"
	"fmt"
	"github.com/knocknote/vitess-sqlparser/sqlparser"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"strconv"
	"time"
)

func SQLOperatorToMongo(sqlOp string) string {
	switch sqlOp {
	case sqlparser.EqualStr:
		return "$eq"
	case sqlparser.LessThanStr:
		return "$lt"
	case sqlparser.GreaterThanStr:
		return "$gt"
	case sqlparser.LessEqualStr:
		return "$lte"
	case sqlparser.GreaterEqualStr:
		return "$gte"
	case sqlparser.NotEqualStr:
		return "$ne"
	case sqlparser.InStr:
		return "$in"
	case sqlparser.NotInStr:
		return "$nin"
		//	case sqlparser.LikeStr:
		//		return "$eq"
		//	case sqlparser.NotLikeStr:
		//		return "$eq"
	case sqlparser.RegexpStr:
		return "$regex"
	case sqlparser.NotRegexpStr:
		return "$regex"
	default:
		return "unknown"
	}
}

func bsonM(key string, val *ValueFromSQL) bson.M {
	if key=="$regex" {
		str_val,ok:= val.val.(string)
		if !ok {
			str_val=""
		}
		return bson.M{key: primitive.Regex{Pattern:str_val, Options:"i"}}
	}
	return bson.M{key: val.val}
}

func bsonMArray(key string, vals []*ValueFromSQL) bson.M {
	if len(vals) == 0 {
		return bson.M{}
	}
	v := make([]interface{}, len(vals))
	for i, val := range vals {
		v[i] = val.val
	}
	return bson.M{key: v}
}

func keyFromColumnName(cn *sqlparser.ColName) string {
	par_key := cn.Qualifier.Name.String()
	par_par_key := cn.Qualifier.Qualifier.String()
	key := cn.Name.String()
	if len(par_key) > 0 {
		key = par_key + "." + key
	}
	if len(par_par_key) > 0 {
		key = par_par_key + "." + key
	}
	return key
}

type ValueFromSQL struct {
	val interface{}
}

func getValueFromSQL(val *sqlparser.SQLVal) *ValueFromSQL {
	switch val.Type {
	case sqlparser.IntVal:
		num, _ := strconv.Atoi(string(val.Val))
		return &ValueFromSQL{num}
	case sqlparser.FloatVal:
		num, _ := strconv.ParseFloat(string(val.Val), 64)
		return &ValueFromSQL{num}
	case sqlparser.StrVal:
		str := string(val.Val)
		return &ValueFromSQL{str}
	default:
		return nil
	}
}

func processFunctionalExpression(expr *sqlparser.FuncExpr) *ValueFromSQL {
	if !expr.Name.EqualString("isodate") || len(expr.Exprs) != 1 {
		return nil
	}
	var res *ValueFromSQL
	visit := func(node sqlparser.SQLNode) (kontinue bool, err error) {
		val, ok := node.(*sqlparser.SQLVal)
		if ok {
			res = getValueFromSQL(val)
			datetime_str, ok := res.val.(string)
			if !ok {
				return false, errors.New("cannot extract date string from value")
			}
			t, err := time.Parse(time.RFC3339, datetime_str)
			if err != nil {
				return false, err
			}
			res.val = t
		}
		return false, nil
	}

	err := expr.Exprs[0].WalkSubtree(visit)
	if err != nil {
		return nil
	}
	return res
}

func getSQLValFromExpr(expr sqlparser.Expr) *ValueFromSQL {
	fe, ok := expr.(*sqlparser.FuncExpr)
	if ok {
		return processFunctionalExpression(fe)
	}
	val, ok := expr.(*sqlparser.SQLVal)
	if !ok {
		return nil
	}
	return getValueFromSQL(val)
}

func processComparisonExpr(expr *sqlparser.ComparisonExpr) (res bson.M, err error) {
	mongoOp := SQLOperatorToMongo(expr.Operator)
	key := keyFromColumnName(expr.Left.(*sqlparser.ColName))
	var vals []*ValueFromSQL
	if tuple, ok := expr.Right.(sqlparser.ValTuple); ok { // SQL in
		for _, elem := range tuple {
			val := getSQLValFromExpr(elem)
			if val == nil {
				return bson.M{}, errors.New("wrong value")
			}
			vals = append(vals, val)
		}
		return bson.M{key: bsonMArray(mongoOp, vals)}, nil
	} else { // SQL =,>,<,>=,<=,regexp
		val := getSQLValFromExpr(expr.Right)
		if val == nil {
			return bson.M{}, errors.New("wrong value")
		}
		if expr.Operator == sqlparser.NotRegexpStr || expr.Operator == sqlparser.RegexpStr {
			_,ok:= val.val.(string)
			if !ok {
				return bson.M{}, errors.New("wrong regexp value")
			}
		}
		if expr.Operator == sqlparser.NotRegexpStr {
			return bson.M{key: bson.M{"$not": bsonM(mongoOp, val)}}, nil
		} else {
			return bson.M{key: bsonM(mongoOp, val)}, nil
		}
	}
}

func processRangeCond(expr *sqlparser.RangeCond) (res bson.M, err error) {
	key := keyFromColumnName(expr.Left.(*sqlparser.ColName))
	var mongoOpLeft, mongoOpRight, mongoCond string
	if expr.Operator == sqlparser.BetweenStr {
		mongoOpLeft = "$gte"
		mongoOpRight = "$lte"
		mongoCond = "$and"
	} else {
		mongoOpLeft = "$lt"
		mongoOpRight = "$gt"
		mongoCond = "$or"
	}
	from := getSQLValFromExpr(expr.From)
	if from == nil {
		return bson.M{}, errors.New("wrong value")
	}
	to := getSQLValFromExpr(expr.To)
	if to == nil {
		return bson.M{}, errors.New("wrong value")
	}
	return bson.M{mongoCond: []bson.M{{key: bsonM(mongoOpLeft, from)},
		{key: bsonM(mongoOpRight, to)}}}, nil

}

func processAndOrExpression(left sqlparser.Expr, right sqlparser.Expr, op string) (res bson.M, err error) {
	bson_left, errLeft := getBSONFromExpression(left)
	if errLeft != nil {
		return bson.M{}, errLeft
	}
	bson_right, errRight := getBSONFromExpression(right)
	if errRight != nil {
		return bson.M{}, errRight
	}
	return bson.M{op: []bson.M{bson_left, bson_right}}, nil
}

func getBSONFromExpression(node sqlparser.Expr) (res bson.M, err error) {
	switch expr := node.(type) {
	case *sqlparser.ComparisonExpr:
		return processComparisonExpr(expr)
	case *sqlparser.RangeCond:
		return processRangeCond(expr)
	case *sqlparser.AndExpr:
		return processAndOrExpression(expr.Left, expr.Right, "$and")
	case *sqlparser.OrExpr:
		return processAndOrExpression(expr.Left, expr.Right, "$or")
	case *sqlparser.ParenExpr:
		return getBSONFromExpression(expr.Expr)
	default:
		return bson.M{}, errors.New("unkwnown expression " + fmt.Sprintf("%T", expr))
	}
}

func getSortBSONFromOrderArray(order_array sqlparser.OrderBy) (bson.M, error) {
	if len(order_array) != 1 {
		return bson.M{}, errors.New("order by should have single column name")
	}

	order := order_array[0]
	val, ok := order.Expr.(*sqlparser.ColName)
	if !ok {
		return bson.M{}, errors.New("order has to be key name")
	}

	name := keyFromColumnName(val)
	sign := 1
	if order.Direction == sqlparser.DescScr {
		sign = -1
	}
	return bson.M{name: sign}, nil
}

func (db *Mongodb) BSONFromSQL(query string) (bson.M, bson.M, error) {
	stmt, err := sqlparser.Parse("select * from dbname " + query)
	if err != nil {
		return bson.M{}, bson.M{}, err
	}
	sel, _ := stmt.(*sqlparser.Select)
	query_mongo := bson.M{}
	sort_mongo := bson.M{}
	if sel.Where != nil {
		query_mongo, err = getBSONFromExpression(sel.Where.Expr)
		if err != nil {
			return bson.M{}, bson.M{}, err
		}
	}

	fmt.Println(query_mongo)
	if len(sel.OrderBy) > 0 {
		sort_mongo, err = getSortBSONFromOrderArray(sel.OrderBy)
		if err != nil {
			return bson.M{}, bson.M{}, err
		}
	}

	return query_mongo, sort_mongo, nil

}
