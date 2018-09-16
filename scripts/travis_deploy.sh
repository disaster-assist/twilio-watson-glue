./scripts/travis_deploy_impl.sh
retval=$?
if [ $retval -eq 0 ]; then
    ./scripts/send.sh success $DISCORD_WEBHOOK
else
    ./scripts/send.sh failure $DISCORD_WEBHOOK

fi

exit $retval
