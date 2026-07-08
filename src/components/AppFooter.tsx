import { appMetadata } from '../config/appMetadata'

function AppFooter() {
    return (
        <footer className="app-footer">
            <p>
                {appMetadata.appName} v{appMetadata.appVersion}
                {' \u00b7 '}Data: {appMetadata.warhammerEditionLabel}
                {' \u00b7 '}API: OpenHammer {appMetadata.openHammerApiEdition}
            </p>
        </footer>
    )
}

export default AppFooter
