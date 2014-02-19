#!/usr/bin/env coffee
{exec} = require 'child_process'
moduleInfo = require '../package.json'

versionTag = 'v' + moduleInfo.version

console.log "Releasing #{moduleInfo.name} #{versionTag}\n"

findTagCmd = "git tag | grep #{versionTag}"
exec findTagCmd, (err, stdout, stderr) ->
  if not err?
    throw new Error("Version #{versionTag} already exists")

  # push to default remote
  pushToRemoteCmd = "git push"
  console.log '* Pushing latest changes...'
  exec pushToRemoteCmd, (err, stdout, stderr) ->
    if err?
      throw new Error("Could not push. Do you have a default remote?")

    console.log '* Tag version and push tags...'
    makeTagCmd = "git tag #{versionTag} && git push --tags"
    exec makeTagCmd, (err) ->
      if err?
        throw new Error("Failed to tag & push to remote")
      console.log "\n=> Published version #{versionTag}\n"
