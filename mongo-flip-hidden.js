/**
 * @author Jitendra Singh Bhadouria
 * @desc Mongo Server side JS Script to flip mongo secondary to mongo hidden,
 * if there is replication lag greater than defined replication threshold
 * and vice versa.
 * */
print("\n====Heptagon Starts here=====\n");

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

    print("This is the Master Node.");

    rsStatus = rs.status();
    rsConf = rs.conf();

    printjson(rsStatus);
    printjson(rsConf);

    primaryTime = getPrimaryTime(rsStatus.members);

    replicationLagThreshold = 600;

    rsStatus.members.forEach(function (row) {
        id = row._id;

        if (row.stateStr != 'PRIMARY') {


            replicationLag = getReplicationLag(primaryTime, row.optimeDate);

            print("Processing Mongo Node with id " + id);
            print("host [" + row.name + "] State [" + row.stateStr + "] Replication Lag [" + replicationLag + "] secs");

            if (replicationLag > replicationLagThreshold) {

                print("Replication Lag is greater than defined Replication Threshold [" + 600 + "] secs");

                rsConf.members.forEach(function (rsConfRow, index) {

                    hidden = rsConfRow.hidden;
                    votes = rsConfRow.votes;

                    if (id == rsConfRow._id) {
                        print("hidden [" + hidden + "] Votes [" + votes + "]");
                        if (hidden == false) {
                            print("Changing to Hidden");
                            changeMongodVisibility(index, true, 0);
                        }
                    }
                });
            } else {

                print("Replication Lag is less than defined Replication Threshold [" + 600 + "] secs");

                rsConf.members.forEach(function (rsConfRow, index) {

                    hidden = rsConfRow.hidden;
                    votes = rsConfRow.votes;

                    if (id == rsConfRow._id) {
                        print("hidden [" + hidden + "] Votes [" + votes + "]");
                        if (hidden == true) {
                            print("Changing to Not Hidden");
                            changeMongodVisibility(index, false, 0.5);
                        }
                    }
                });
            }

        }

    });

} else {
    print("Warning:Script only runs on Mongo Primary Nodes.");
}