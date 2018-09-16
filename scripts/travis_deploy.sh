./travis_deploy_impl.sh
retval=$?
if [ retval -eq 0 ]; then
    ./send.sh success $DISCORD_WEBHOOK
else
    ./send.sh failure $DISCORD_WEBHOOK
    
fi

exit $retval
