import sgqlc.types
import sgqlc.types.datetime


schema = sgqlc.types.Schema()



########################################################################
# Scalars and Enumerations
########################################################################
class Acls(sgqlc.types.Enum):
    __schema__ = schema
    __choices__ = ('ADMIN', 'READ')


Boolean = sgqlc.types.Boolean

DateTime = sgqlc.types.datetime.DateTime

ID = sgqlc.types.ID

class Map(sgqlc.types.Scalar):
    __schema__ = schema


String = sgqlc.types.String


########################################################################
# Input Objects
########################################################################
class FieldsToDelete(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('id', 'fields')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    fields = sgqlc.types.Field(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null(String))), graphql_name='fields')


class FieldsToSet(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('id', 'fields')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    fields = sgqlc.types.Field(sgqlc.types.non_null(Map), graphql_name='fields')


class InputBeamtimeUser(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('applicant', 'email', 'institute', 'lastname', 'user_id', 'username')
    applicant = sgqlc.types.Field(String, graphql_name='applicant')
    email = sgqlc.types.Field(String, graphql_name='email')
    institute = sgqlc.types.Field(String, graphql_name='institute')
    lastname = sgqlc.types.Field(String, graphql_name='lastname')
    user_id = sgqlc.types.Field(String, graphql_name='userId')
    username = sgqlc.types.Field(String, graphql_name='username')


class InputOnlineAnylysisMeta(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('asapo_beamtime_token_path', 'reserved_nodes', 'slurm_reservation', 'slurm_partition', 'ssh_private_key_path', 'ssh_public_key_path', 'user_account')
    asapo_beamtime_token_path = sgqlc.types.Field(String, graphql_name='asapoBeamtimeTokenPath')
    reserved_nodes = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='reservedNodes')
    slurm_reservation = sgqlc.types.Field(String, graphql_name='slurmReservation')
    slurm_partition = sgqlc.types.Field(String, graphql_name='slurmPartition')
    ssh_private_key_path = sgqlc.types.Field(String, graphql_name='sshPrivateKeyPath')
    ssh_public_key_path = sgqlc.types.Field(String, graphql_name='sshPublicKeyPath')
    user_account = sgqlc.types.Field(String, graphql_name='userAccount')


class InputUserPreferences(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('schema',)
    schema = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='schema')


class InputUsers(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('door_db', 'special', 'unknown')
    door_db = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='doorDb')
    special = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='special')
    unknown = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='unknown')


class NewBeamtimeMeta(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('applicant', 'beamline', 'beamline_alias', 'beamline_setup', 'id', 'status', 'contact', 'core_path', 'event_end', 'event_start', 'facility', 'generated', 'leader', 'online_analysis', 'pi', 'proposal_id', 'proposal_type', 'title', 'unix_id', 'users', 'child_collection_name', 'custom_values')
    applicant = sgqlc.types.Field(InputBeamtimeUser, graphql_name='applicant')
    beamline = sgqlc.types.Field(String, graphql_name='beamline')
    beamline_alias = sgqlc.types.Field(String, graphql_name='beamlineAlias')
    beamline_setup = sgqlc.types.Field(String, graphql_name='beamlineSetup')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    status = sgqlc.types.Field(String, graphql_name='status')
    contact = sgqlc.types.Field(String, graphql_name='contact')
    core_path = sgqlc.types.Field(String, graphql_name='corePath')
    event_end = sgqlc.types.Field(DateTime, graphql_name='eventEnd')
    event_start = sgqlc.types.Field(DateTime, graphql_name='eventStart')
    facility = sgqlc.types.Field(String, graphql_name='facility')
    generated = sgqlc.types.Field(DateTime, graphql_name='generated')
    leader = sgqlc.types.Field(InputBeamtimeUser, graphql_name='leader')
    online_analysis = sgqlc.types.Field(InputOnlineAnylysisMeta, graphql_name='onlineAnalysis')
    pi = sgqlc.types.Field(InputBeamtimeUser, graphql_name='pi')
    proposal_id = sgqlc.types.Field(String, graphql_name='proposalId')
    proposal_type = sgqlc.types.Field(String, graphql_name='proposalType')
    title = sgqlc.types.Field(String, graphql_name='title')
    unix_id = sgqlc.types.Field(String, graphql_name='unixId')
    users = sgqlc.types.Field(InputUsers, graphql_name='users')
    child_collection_name = sgqlc.types.Field(String, graphql_name='childCollectionName')
    custom_values = sgqlc.types.Field(Map, graphql_name='customValues')


class NewCollectionEntry(sgqlc.types.Input):
    __schema__ = schema
    __field_names__ = ('id', 'event_start', 'event_end', 'title', 'child_collection_name', 'custom_values')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    event_start = sgqlc.types.Field(DateTime, graphql_name='eventStart')
    event_end = sgqlc.types.Field(DateTime, graphql_name='eventEnd')
    title = sgqlc.types.Field(String, graphql_name='title')
    child_collection_name = sgqlc.types.Field(String, graphql_name='childCollectionName')
    custom_values = sgqlc.types.Field(Map, graphql_name='customValues')



########################################################################
# Output Objects and Interfaces
########################################################################
class BaseCollectionEntry(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('id', 'event_start', 'event_end', 'title')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    event_start = sgqlc.types.Field(DateTime, graphql_name='eventStart')
    event_end = sgqlc.types.Field(DateTime, graphql_name='eventEnd')
    title = sgqlc.types.Field(String, graphql_name='title')


class BeamtimeUser(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('applicant', 'email', 'institute', 'lastname', 'user_id', 'username')
    applicant = sgqlc.types.Field(String, graphql_name='applicant')
    email = sgqlc.types.Field(String, graphql_name='email')
    institute = sgqlc.types.Field(String, graphql_name='institute')
    lastname = sgqlc.types.Field(String, graphql_name='lastname')
    user_id = sgqlc.types.Field(String, graphql_name='userId')
    username = sgqlc.types.Field(String, graphql_name='username')


class CollectionEntryInterface(sgqlc.types.Interface):
    __schema__ = schema
    __field_names__ = ('id', 'event_start', 'event_end', 'title', 'child_collection_name', 'child_collection', 'custom_values', 'type', 'parent_beamtime_meta', 'json_string')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    event_start = sgqlc.types.Field(DateTime, graphql_name='eventStart')
    event_end = sgqlc.types.Field(DateTime, graphql_name='eventEnd')
    title = sgqlc.types.Field(String, graphql_name='title')
    child_collection_name = sgqlc.types.Field(String, graphql_name='childCollectionName')
    child_collection = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(BaseCollectionEntry)), graphql_name='childCollection')
    custom_values = sgqlc.types.Field(Map, graphql_name='customValues', args=sgqlc.types.ArgDict((
        ('select_fields', sgqlc.types.Arg(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='selectFields', default=None)),
        ('remove_fields', sgqlc.types.Arg(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='removeFields', default=None)),
))
    )
    type = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='type')
    parent_beamtime_meta = sgqlc.types.Field(sgqlc.types.non_null('ParentBeamtimeMeta'), graphql_name='parentBeamtimeMeta')
    json_string = sgqlc.types.Field(String, graphql_name='jsonString')


class Mutation(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('create_meta', 'delete_meta', 'delete_subcollection', 'add_collection_entry', 'modify_beamtime_meta', 'update_collection_entry_fields', 'add_collection_entry_fields', 'delete_collection_entry_fields', 'set_user_preferences')
    create_meta = sgqlc.types.Field('BeamtimeMeta', graphql_name='createMeta', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(NewBeamtimeMeta), graphql_name='input', default=None)),
))
    )
    delete_meta = sgqlc.types.Field(String, graphql_name='deleteMeta', args=sgqlc.types.ArgDict((
        ('id', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='id', default=None)),
))
    )
    delete_subcollection = sgqlc.types.Field(String, graphql_name='deleteSubcollection', args=sgqlc.types.ArgDict((
        ('id', sgqlc.types.Arg(sgqlc.types.non_null(String), graphql_name='id', default=None)),
))
    )
    add_collection_entry = sgqlc.types.Field('CollectionEntry', graphql_name='addCollectionEntry', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(NewCollectionEntry), graphql_name='input', default=None)),
))
    )
    modify_beamtime_meta = sgqlc.types.Field('BeamtimeMeta', graphql_name='modifyBeamtimeMeta', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(FieldsToSet), graphql_name='input', default=None)),
))
    )
    update_collection_entry_fields = sgqlc.types.Field('CollectionEntry', graphql_name='updateCollectionEntryFields', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(FieldsToSet), graphql_name='input', default=None)),
))
    )
    add_collection_entry_fields = sgqlc.types.Field('CollectionEntry', graphql_name='addCollectionEntryFields', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(FieldsToSet), graphql_name='input', default=None)),
))
    )
    delete_collection_entry_fields = sgqlc.types.Field('CollectionEntry', graphql_name='deleteCollectionEntryFields', args=sgqlc.types.ArgDict((
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(FieldsToDelete), graphql_name='input', default=None)),
))
    )
    set_user_preferences = sgqlc.types.Field('UserAccount', graphql_name='setUserPreferences', args=sgqlc.types.ArgDict((
        ('id', sgqlc.types.Arg(sgqlc.types.non_null(ID), graphql_name='id', default=None)),
        ('input', sgqlc.types.Arg(sgqlc.types.non_null(InputUserPreferences), graphql_name='input', default=None)),
))
    )


class OnlineAnylysisMeta(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('asapo_beamtime_token_path', 'reserved_nodes', 'slurm_reservation', 'slurm_partition', 'ssh_private_key_path', 'ssh_public_key_path', 'user_account')
    asapo_beamtime_token_path = sgqlc.types.Field(String, graphql_name='asapoBeamtimeTokenPath')
    reserved_nodes = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='reservedNodes')
    slurm_reservation = sgqlc.types.Field(String, graphql_name='slurmReservation')
    slurm_partition = sgqlc.types.Field(String, graphql_name='slurmPartition')
    ssh_private_key_path = sgqlc.types.Field(String, graphql_name='sshPrivateKeyPath')
    ssh_public_key_path = sgqlc.types.Field(String, graphql_name='sshPublicKeyPath')
    user_account = sgqlc.types.Field(String, graphql_name='userAccount')


class ParentBeamtimeMeta(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('id', 'applicant', 'beamline', 'beamline_alias', 'status', 'contact', 'core_path', 'event_end', 'event_start', 'facility', 'generated', 'leader', 'online_analysis', 'pi', 'proposal_id', 'proposal_type', 'title', 'unix_id', 'users')
    id = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='id')
    applicant = sgqlc.types.Field(BeamtimeUser, graphql_name='applicant')
    beamline = sgqlc.types.Field(String, graphql_name='beamline')
    beamline_alias = sgqlc.types.Field(String, graphql_name='beamlineAlias')
    status = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='status')
    contact = sgqlc.types.Field(String, graphql_name='contact')
    core_path = sgqlc.types.Field(String, graphql_name='corePath')
    event_end = sgqlc.types.Field(DateTime, graphql_name='eventEnd')
    event_start = sgqlc.types.Field(DateTime, graphql_name='eventStart')
    facility = sgqlc.types.Field(String, graphql_name='facility')
    generated = sgqlc.types.Field(DateTime, graphql_name='generated')
    leader = sgqlc.types.Field(BeamtimeUser, graphql_name='leader')
    online_analysis = sgqlc.types.Field(OnlineAnylysisMeta, graphql_name='onlineAnalysis')
    pi = sgqlc.types.Field(BeamtimeUser, graphql_name='pi')
    proposal_id = sgqlc.types.Field(String, graphql_name='proposalId')
    proposal_type = sgqlc.types.Field(String, graphql_name='proposalType')
    title = sgqlc.types.Field(String, graphql_name='title')
    unix_id = sgqlc.types.Field(String, graphql_name='unixId')
    users = sgqlc.types.Field('Users', graphql_name='users')


class Query(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('meta', 'collections', 'unique_fields', 'user')
    meta = sgqlc.types.Field(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null('BeamtimeMeta'))), graphql_name='meta', args=sgqlc.types.ArgDict((
        ('filter', sgqlc.types.Arg(String, graphql_name='filter', default=None)),
        ('order_by', sgqlc.types.Arg(String, graphql_name='orderBy', default=None)),
))
    )
    collections = sgqlc.types.Field(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null('CollectionEntry'))), graphql_name='collections', args=sgqlc.types.ArgDict((
        ('filter', sgqlc.types.Arg(String, graphql_name='filter', default=None)),
        ('order_by', sgqlc.types.Arg(String, graphql_name='orderBy', default=None)),
))
    )
    unique_fields = sgqlc.types.Field(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null('UniqueField'))), graphql_name='uniqueFields', args=sgqlc.types.ArgDict((
        ('filter', sgqlc.types.Arg(String, graphql_name='filter', default=None)),
        ('keys', sgqlc.types.Arg(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null(String))), graphql_name='keys', default=None)),
))
    )
    user = sgqlc.types.Field('UserAccount', graphql_name='user', args=sgqlc.types.ArgDict((
        ('id', sgqlc.types.Arg(sgqlc.types.non_null(ID), graphql_name='id', default=None)),
))
    )


class UniqueField(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('key_name', 'values')
    key_name = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='keyName')
    values = sgqlc.types.Field(sgqlc.types.non_null(sgqlc.types.list_of(sgqlc.types.non_null(String))), graphql_name='values')


class UserAccount(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('id', 'preferences')
    id = sgqlc.types.Field(sgqlc.types.non_null(ID), graphql_name='id')
    preferences = sgqlc.types.Field(sgqlc.types.non_null('UserPreferences'), graphql_name='preferences')


class UserPreferences(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('schema',)
    schema = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='schema')


class Users(sgqlc.types.Type):
    __schema__ = schema
    __field_names__ = ('door_db', 'special', 'unknown')
    door_db = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='doorDb')
    special = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='special')
    unknown = sgqlc.types.Field(sgqlc.types.list_of(sgqlc.types.non_null(String)), graphql_name='unknown')


class BeamtimeMeta(sgqlc.types.Type, CollectionEntryInterface):
    __schema__ = schema
    __field_names__ = ('applicant', 'beamline', 'beamline_alias', 'beamline_setup', 'status', 'contact', 'core_path', 'facility', 'generated', 'leader', 'online_analysis', 'pi', 'proposal_id', 'proposal_type', 'unix_id', 'users')
    applicant = sgqlc.types.Field(BeamtimeUser, graphql_name='applicant')
    beamline = sgqlc.types.Field(String, graphql_name='beamline')
    beamline_alias = sgqlc.types.Field(String, graphql_name='beamlineAlias')
    beamline_setup = sgqlc.types.Field(String, graphql_name='beamlineSetup')
    status = sgqlc.types.Field(sgqlc.types.non_null(String), graphql_name='status')
    contact = sgqlc.types.Field(String, graphql_name='contact')
    core_path = sgqlc.types.Field(String, graphql_name='corePath')
    facility = sgqlc.types.Field(String, graphql_name='facility')
    generated = sgqlc.types.Field(DateTime, graphql_name='generated')
    leader = sgqlc.types.Field(BeamtimeUser, graphql_name='leader')
    online_analysis = sgqlc.types.Field(OnlineAnylysisMeta, graphql_name='onlineAnalysis')
    pi = sgqlc.types.Field(BeamtimeUser, graphql_name='pi')
    proposal_id = sgqlc.types.Field(String, graphql_name='proposalId')
    proposal_type = sgqlc.types.Field(String, graphql_name='proposalType')
    unix_id = sgqlc.types.Field(String, graphql_name='unixId')
    users = sgqlc.types.Field(Users, graphql_name='users')


class CollectionEntry(sgqlc.types.Type, CollectionEntryInterface):
    __schema__ = schema
    __field_names__ = ()



########################################################################
# Unions
########################################################################

########################################################################
# Schema Entry Points
########################################################################
schema.query_type = Query
schema.mutation_type = Mutation
schema.subscription_type = None

