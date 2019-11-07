#!/bin/bash

ROOT_DIR=/root/workspace/js/git
OLD_REPO_DIR=${ROOT_DIR}/repositories
NEW_REPO_DIR=${ROOT_DIR}/data/git
USERNAME_PREFIX=gitlab_www_

for username in `ls ${OLD_REPO_DIR}` 
do
    prefix=${username:0:11}
    if [ ${prefix} != ${USERNAME_PREFIX} ]; then
        continue
    fi
    realname=${username:11}
    #echo ${realname}

    for reponame in `ls ${OLD_REPO_DIR}/${username}`
    do
        short_reponame=${reponame%.git}
        old_repopath=${OLD_REPO_DIR}/${username}/${reponame}
        new_reponame=`echo -n ${realname}/${short_reponame} | base64 -w 0`
        new_repopath=${NEW_REPO_DIR}/${new_reponame}
        #echo ${old_repopath}
        #echo ${new_repopath}

        echo mv ${old_repopath} ${new_repopath}

        #mv ${old_repopath} ${new_repopath}
        #echo ${realname}/${reponame}
        #echo ${new_reponame}
    done
done

