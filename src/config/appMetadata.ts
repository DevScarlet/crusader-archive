import packageJson from '../../package.json'

export const OPEN_HAMMER_API_EDITION = '10e'

export const appMetadata = {
    appName: 'Crusader Archive',
    appVersion: packageJson.version,
    warhammerEditionLabel: 'Warhammer 40K 10th Edition',
    openHammerApiEdition: OPEN_HAMMER_API_EDITION,
} as const
