from python_graphql_client import GraphqlClient
from string import Template
from random import randint,randrange
from coolname import generate_slug,generate
import datetime

def rname():
  return generate()[0]
def randomMail():
    r = generate()
    return r[0]+'.'+r[1]+'@'+r[2]+'.com'
def randId():
    return randint(10000000,99999999)
# Instantiate the client with a websocket endpoint.
client = GraphqlClient(endpoint="http://localhost/default/asapm/api/query")
from python_graphql_client import GraphqlClient


def random_date(start,intervalDays):
    if intervalDays<0:
        return start - datetime.timedelta(minutes=randrange(-intervalDays*24*60))
    else:
        return start + datetime.timedelta(minutes=randrange(intervalDays*24*60))

def addMeta():
    # Create the query string and variables required for the request.
    query = """
    mutation {
      createMeta(
        input: {
          status: $status
          customValues: { hello: { time: 1234, date: "1141" }, bye: "3445" }
          applicant: {
            email: "$email"
            institute: "Deutsches Elektronen-Synchrotron"
            lastname: "$lastname"
            userId: "$uid"
            username: "$uname"
          }
          beamline: "$beamline"
          beamlineAlias: "$beamline"
          beamtimeId: "$beamtimeId"
          contact: "$contact"
          corePath: "/asap3/petra3/gpfs/$beamline/2020/data/$beamtimeId"
          eventEnd: "$eventEnd"
          eventStart: "$eventStart"
          facility: "facility"
          generated: "$generated"
          leader: {
            email: "$lemail"
            institute: "$linstitute"
            lastname: "$llastname"
            userId: "$luserId"
            username: "$lusername"
          }
          pi: {
            email: "$piemail"
            institute: "$piinstitute"
            lastname: "$pilastname"
            userId: "$piuserId"
            username: "$piusername"
          }
          proposalId: "$proposalId"
          proposalType: "C"
          title: "$title"
          unixId: "$unixId"
          users: {
            doorDb: ["user1", "user2", "user3"]
            special: []
            unknown: []
          }
        }
      ) {
        beamtimeId
        beamline
        status
        title
        generated
      }
    }
    """

    statuses=['Completed','Scheduled','Running']
    facilities=['PETRA III','Flash']

    refDate = datetime.datetime(2020, 1, 1,00,00)
    startDate = random_date(refDate,365)
    endDate = random_date(startDate,randint(1,7))
    generated = random_date(startDate,-1)

    d = dict(title=generate_slug(4),email=randomMail(),lastname=rname(),
             uname=rname(),uid=randId(),beamline='p0'+str(randint(1,9)),
             beamtimeId=randId(),proposalId=randId(),
             status=statuses[randint(0,2)],
             contact=randomMail(),
             facility=facilities[randint(0,1)],
             unixId = randint(1000,9999),
             lemail = randomMail(),
             linstitute = rname(),
             llastname = rname(),
             luserId = randint(1000,9999),
             lusername = rname(),
             piemail = randomMail(),
             piinstitute = rname(),
             pilastname = rname(),
             piuserId = randint(1000,9999),
             piusername = rname(),
             eventEnd = endDate.isoformat() + 'Z',
             eventStart = startDate.isoformat() + 'Z',
             generated =generated.isoformat() + 'Z'
    )
    s = Template(query)
    query = s.substitute(d)

    data = client.execute(query=query)

for i in range(0, 10000):
    addMeta()
