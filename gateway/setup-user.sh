if getent passwd ${UID} >/dev/null; then
    echo "User with UID ${UID} already exists"
else
    if getent group ${GID} >/dev/null; then
        echo "Group with GID ${GID} already exists"
    else
        groupadd -g ${GID} shirayuki
    fi &&
        useradd -l -u ${UID} -g ${GID} shirayuki &&
        install -d -m 0755 -o shirayuki -g ${GID} /home/shirayuki
fi
