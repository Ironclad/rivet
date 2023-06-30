export const baseDirs = {
    app: 'app',
    appCache: 'appCache',
    appConfig: 'appConfig',
    appData: 'appData',
    appLocalData: 'appLocalData',
    appLog: 'appLog',
    audio: 'audio',
    cache: 'cache',
    config: 'config',
    data: 'data',
    desktop: 'desktop',
    document: 'document',
    download: 'download',
    executable: 'executable',
    font: 'font',
    home: 'home',
    localData: 'localData',
    log: 'log',
    picture: 'picture',
    public: 'public',
    resource: 'resource',
    runtime: 'runtime',
    temp: 'temp',
    template: 'template',
    video: 'video',
};
export function assertBaseDir(baseDir) {
    if (!(baseDir in baseDirs)) {
        throw new Error(`Invalid base directory: ${baseDir}`);
    }
}
