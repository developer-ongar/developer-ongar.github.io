module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"], // optional
      config: {
        bucket: 'my-bucket',
        folder: 'my/key/prefix'
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
      packagerConfig: {
        icon: '/images/icon.icns' 
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
