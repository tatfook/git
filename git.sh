#!/bin/bash

OLD_REPO_DIR=/git/repositories
NEW_REPO_DIR=/git-data/git
#OLD_REPO_DIR=/root/workspace/js/git/repositories
#NEW_REPO_DIR=/root/workspace/js/git/data/git
USERNAME_PREFIX=gitlab_www_

#rm -fr ${NEW_REPO_DIR}/*
#rm -fr ${OLD_REPO_DIR}
#tar -zxvf repo.tar.gz 

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
        # continue .wiki.git 
        if [ "${reponame:0-9:9}" = ".wiki.git"  -o "${reponame}" = "__keepwork__.git" ]; then
            echo "continue ${reponame}"
            continue;
        fi

        short_reponame=${reponame%.git}
        old_repopath=${OLD_REPO_DIR}/${username}/${reponame}
        new_reponame=`echo -n ${realname}/${short_reponame} | base64 -w 0`
        new_repopath=${NEW_REPO_DIR}/${new_reponame}
        #echo ${old_repopath}
        #echo ${new_repopath}

        if [ -e ${new_repopath} ]; then
            echo ${new_repopath} already exist!!!
        else
            echo mv ${old_repopath} ${new_repopath}
            #mv ${old_repopath} ${new_repopath}
        fi
    done
done

