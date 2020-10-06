import sgqlc
from sgqlc.operation import Operation
from asapm import schema

from sgqlc.endpoint.http import HTTPEndpoint

url = 'http://localhost/default/asapm/api/query'

endpoint = HTTPEndpoint(url)

op = Operation(schema.Query)
meta = op.meta()


meta.__fields__()
#meta.event_start()
#meta.custom_values()
data = endpoint(op)
res = (op + data).meta
res_meta: schema.BeamtimeMeta = res[1]

#print(res_meta.custom_values['blabla'])

#meta = schema.NewBeamtimeMeta()
#meta.id = '123456'
#meta.status= 'running'

#op = Operation(schema.Mutation)
#new_meta = op.create_meta(input = meta)
#new_meta.id()

#print(op)

#data = endpoint(op)

#res : schema.BeamtimeMeta = (op + data).create_meta
#print (res)
