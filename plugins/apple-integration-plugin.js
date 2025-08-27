const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');

function addAppleIntegrationFiles(config, { projectRoot }) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    
    // Add our native files to the Xcode project
    const appleIntegrationHeaderPath = path.join(projectRoot, 'ios', 'BulletJournalApp', 'AppleIntegration.h');
    const appleIntegrationImplPath = path.join(projectRoot, 'ios', 'BulletJournalApp', 'AppleIntegration.m');
    
    // Add files to project (Expo will handle copying them)
    xcodeProject.addSourceFile('AppleIntegration.h', {}, xcodeProject.findPBXGroupKey({ name: 'BulletJournalApp' }));
    xcodeProject.addSourceFile('AppleIntegration.m', {}, xcodeProject.findPBXGroupKey({ name: 'BulletJournalApp' }));
    
    // Add EventKit framework
    xcodeProject.addFramework('EventKit.framework');
    
    return config;
  });
}

module.exports = (config) => {
  return addAppleIntegrationFiles(config, {
    projectRoot: process.cwd()
  });
};