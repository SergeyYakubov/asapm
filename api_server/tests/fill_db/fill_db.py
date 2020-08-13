from python_graphql_client import GraphqlClient
from string import Template
from random import randint,randrange
from coolname import generate_slug,generate
import datetime

def rname():
  return generate()[0]
def randomMail():
    r = generate()
    return r[0]+'.'+r[0]+'@'+r[0]+'.com'
def randId():
    return randint(10000000,99999999)
# Instantiate the client with a websocket endpoint.
#client = GraphqlClient(endpoint="http://guest-k8s-node3.desy.de/yakser/asapm/api/query")
#token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkMW9wOG9yZFBSVndnTUNrQnQzazdVZXM0WXBLeHA0Wkt0YTFmUXU1VktNIn0.eyJleHAiOjE1OTc5NTc1OTUsImlhdCI6MTU5Nzg3MTE5NSwianRpIjoiNTYyOTRhYjItZjYwOS00MDcyLTlkYzgtMjMwNzRkODE3NmUwIiwiaXNzIjoiaHR0cHM6Ly9rdWJlLWtleWNsb2FrLmRlc3kuZGUvYXV0aC9yZWFsbXMvYXNhcCIsInN1YiI6ImVjNzkzNjRmLWRjOGEtNDVlZS04YWZlLTQxN2NjMTM0ODUyYSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFzYXBtLXNlcnZpY2UiLCJzZXNzaW9uX3N0YXRlIjoiZjdlY2IzOTctMWZlNC00MDM4LWIxZmQtMjVmNTg0Mzg0YjhkIiwiYWNyIjoiMSIsInNjb3BlIjoicHJvZmlsZSIsImNsaWVudElkIjoiYXNhcG0tc2VydmljZSIsImNsaWVudEhvc3QiOiI5MS4yNDguMjUxLjE5OCIsInJvbGVzIjpbImluZ2VzdG9yIl0sInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1hc2FwbS1zZXJ2aWNlIiwiY2xpZW50QWRkcmVzcyI6IjkxLjI0OC4yNTEuMTk4In0.ULRn2ixvJwWZ-dYbFfqE2VXY-x52wTcYtajIR0T1kSxnRRdDVfsbDlYhYepVNhVuBKE8wJoWj_hjbo4WxyBldQYygMe564U51hjdDMUg-zp6wRHGt-GSeFcu0oi5VYmg_y3BAwFB2PLTcg312HdN5EboskCw_VbH6iPw7BSAksG4cZtEAzeE_hCjwk_3h0wz-wI4i4ykHrqBKjzvzTDiJNKGfXyFnH-9eLdoo1JEUQwYMIlay4lzhALLs4KDAZyRJ4yVYD8xVL1UhSS-bnBWPMLTgg6Qlbn2Qosk0t1A4XWaH4KMf21WMOCW5KqVhxkf9gx3XZDfcs0_msA4bzkCEw"
token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJkMW9wOG9yZFBSVndnTUNrQnQzazdVZXM0WXBLeHA0Wkt0YTFmUXU1VktNIn0.eyJleHAiOjE1OTc5NTc4NTMsImlhdCI6MTU5Nzg3MTQ1MywianRpIjoiNjk1ODM3MjMtMWJiZC00YmU0LTkwNWEtMGIyNjdlNmI4NzFhIiwiaXNzIjoiaHR0cHM6Ly9rdWJlLWtleWNsb2FrLmRlc3kuZGUvYXV0aC9yZWFsbXMvYXNhcCIsInN1YiI6ImVjNzkzNjRmLWRjOGEtNDVlZS04YWZlLTQxN2NjMTM0ODUyYSIsInR5cCI6IkJlYXJlciIsImF6cCI6ImFzYXBtLXNlcnZpY2UiLCJzZXNzaW9uX3N0YXRlIjoiMmJmOTVjZjQtMDdjMy00NWRmLWE4YTktZDEzNzIzYmU3ZGQxIiwiYWNyIjoiMSIsInNjb3BlIjoicHJvZmlsZSIsImNsaWVudElkIjoiYXNhcG0tc2VydmljZSIsImNsaWVudEhvc3QiOiI5MS4yNDguMjUxLjE5OCIsInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC1hc2FwbS1zZXJ2aWNlIiwiY2xpZW50QWRkcmVzcyI6IjkxLjI0OC4yNTEuMTk4In0.dd1m1kwPWARm3GMcXv-nf5in-CTIOjvvtqprGI_aFdJDuDRSdc1cVjDO0Gj4K0zT5W29T5yfjVW65xvH8K6xkrCvQbVfFASDVp-hoyz_laLRK0VlgKY0sPpupMM5uvpA5SPAHcCyWsBK8_F1y0fVhTQlbSB_FWT0MZ2eFJiAiSSiEb9D7jT9-pudUFUyH1Be-hhBRKuaM6hVBmvzByBFX-m1saRXVXXbeJZg_uKD0XSWPSI6klCNuV63ul21jic3afDYgK1B17tYgMoI1KZbw73PTlIII-MYHgnY_9NcCQZDXgUUngzfYrPblSHwXKLg3uJXSe4smp5kkn1C3aRPqw"
client = GraphqlClient(endpoint="http://localhost/default/asapm/api/query",
                       headers= {"Authorization": "Bearer "+ token})


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
          customValues: {
            city: "Hamburg",
            tags: ["test1","test2"],
            conditions: {
               temp: 23,
               humidity: 60
               },
            detector: {
              name: "pilatus",
              status: {
                blocks: "1",
                rate: "200Hz",
                test: {
                    b:2,
                    a:1
                }
              }
            }
          }
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
          onlineAnalysis: {
           asapoBeamtimeTokenPath: "/shared/asapo_token"
           reservedNodes: ["node1", "node2", "node2"]
           slurmReservation: "ponline"
           slurmPartition: "$beamtimeId"
           sshPrivateKeyPath: "shared/rsa-key.pem"
           sshPublicKeyPath: "shared/rsa-key.pub"
           userAccount: "bttest03"
          }         
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
#    print (query)
    res = client.execute(query=query)
    print (res)
for i in range(0, 1):
    addMeta()
