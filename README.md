# heptagon

## Mongo Server side Javascript to flip hidden/secondary replica.

This mongo server side script will make secondary mongo replica to **hidden** 
if **replication lag** is greater than the defined **replication lag threshold**
and will bring hidden replica again to secondary in vice versa case.

# Use Case

When some application written in such a way that all read queries will route to mongo
secondary replica. In this case, if there is a replication lag (let say 1 hour) in any 
of the mongod node, then all the queries routed to this mongo node will not give real 
time result because of the replication lag.

Assuming this scenario, if there is a huge replication lag on any mongo node then, this
node can be made as hidden using this script. According to mongo hidden node concept, 
no queries will be routed to hidden node. In this way, application will read from other 
secondary or primary node (according to the mongo client configuration). Once the 
replication lag is less than the defined replication threshold, this node will again
be converted to secondary and will be available for read queries.

# Usage

Assuming mongo node is running on localhost and port 27018. Script can be run as follows:

```mongo localhost:27018 mongo-flip-hidden.js```

