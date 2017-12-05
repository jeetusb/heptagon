/**
 * @author Jitendra Singh Bhadouria
 * @desc Mongo Server side JS Script to flip mongo secondary to mongo hidden,
 * if there is replication lag greater than defined replication threshold
 * and vice versa.
 * If there is a deliberate need to keep any replica set member hidden, then, add votes = 0
 * to it.
 * */
print("\n====Begin of Heptagon=====\n");

master = db.isMaster().ismaster

function getPrimaryTime(members) {
    primaryOpTime = '';
    members.forEach(function (row) {
        if (row.stateStr == 'PRIMARY') {
            primaryOpTime = row.optimeDate;
        }
    });
    return primaryOpTime;
}


function getReplicationLag(primaryOpTime, secondaryOpTime) {
    var unixtime1 = Date.parse(primaryOpTime) / 1000;
    var unixtime2 = Date.parse(secondaryOpTime) / 1000;
    return unixtime1 - unixtime2;
}


function changeMongodVisibility(index, hidden, priority) {
    cfg = rs.conf()
    cfg.members[index].priority = priority
    cfg.members[index].hidden = hidden
    changeConfigStatus = rs.reconfig(cfg)

    printjson(changeConfigStatus);
}



if (master == true) {

    print("primary node");

    rsStatus = rs.status();
    rsConf = rs.conf();

//    printjson(rsStatus);
//    printjson(rsConf);

    primaryTime = getPrimaryTime(rsStatus.members);

    replicationLagThreshold = 600;

    rsStatus.members.forEach(function (row) {
        id = row._id;

        if (row.stateStr != 'PRIMARY') {


            replicationLag = getReplicationLag(primaryTime, row.optimeDate);

            print("processing mongod node with id " + id);
            print("host [" + row.name + "] | state [" + row.stateStr + "] | replication lag [" + replicationLag + "] secs | replication threshold [" + replicationLagThreshold + "] secs");

            if (replicationLag >= replicationLagThreshold) {

                print("replication lag >= replication threshold");

                rsConf.members.forEach(function (rsConfRow, index) {

                    hidden = rsConfRow.hidden;
                    votes = rsConfRow.votes;

                    if (id == rsConfRow._id) {
                        print("hidden [" + hidden + "] Votes [" + votes + "]");
                        if (hidden == false && votes == 1) {
                            print("switch mongod to hidden");
                            changeMongodVisibility(index, true, 0);
                        }
                    }
                });
            } else {

                print("replication lag < replication threshold");

                rsConf.members.forEach(function (rsConfRow, index) {

                    hidden = rsConfRow.hidden;
                    votes = rsConfRow.votes;

                    if (id == rsConfRow._id) {
                        print("hidden [" + hidden + "] Votes [" + votes + "]");
                        if (hidden == true && votes == 1) {
                            print("switch mongod back to not hidden");
                            changeMongodVisibility(index, false, 0.5);
                        }
                    }
                });
            }

        }

    });

} else {
    print("warning:script only runs on mongo primary nodes.");
}

print("\n====End of Heptagon=====\n");