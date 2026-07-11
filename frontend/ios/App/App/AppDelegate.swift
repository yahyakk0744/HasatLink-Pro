import UIKit
import WebKit
import Capacitor
import FacebookCore

#if canImport(AppIntents)
import AppIntents
#endif

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /// Cold-start shortcut, replayed once the webview is ready in didBecomeActive.
    private var pendingShortcut: String?

    /// CI-only screenshot route, replayed once the webview is ready in didBecomeActive.
    /// Only ever populated by `simctl launch`'s SCREENSHOT_ROUTE env var from
    /// scripts/capture-ios-screenshots.mjs — never set in a real launch.
    private var pendingScreenshotRoute: String?

    /// Returns true only when a real Facebook App ID has been plugged into Info.plist.
    /// Keeps the SDK dormant while the placeholder is in place so Apple reviewers
    /// never hit a misconfigured FB init path.
    private var facebookConfigured: Bool {
        guard let appId = Bundle.main.object(forInfoDictionaryKey: "FacebookAppID") as? String else { return false }
        return !appId.isEmpty && !appId.contains("REPLACE_WITH")
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if facebookConfigured {
            ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
        }

        // Capture cold-start Quick Action shortcut. We can't dispatch yet because the
        // webview is still loading — defer to applicationDidBecomeActive.
        if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            pendingShortcut = mapShortcutType(shortcut.type)
        }

        if let route = ProcessInfo.processInfo.environment["SCREENSHOT_ROUTE"], !route.isEmpty {
            pendingScreenshotRoute = route
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Replay any cold-start Quick Action once the webview is up.
        if let pending = pendingShortcut {
            pendingShortcut = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                self?.deliverAction(pending)
            }
        }

        // Pick up any pending action stashed by an App Intent (Siri / Spotlight).
        if let intentAction = UserDefaults.standard.string(forKey: "HasatLinkPendingAction") {
            UserDefaults.standard.removeObject(forKey: "HasatLinkPendingAction")
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                self?.deliverAction(intentAction)
            }
        }

        // Replay any cold-start CI screenshot route once the webview is up.
        // Fired repeatedly over several seconds rather than once — a cold
        // launch's splash screen + JS bundle boot can easily outlast a single
        // fixed delay, and a route we fire before App.tsx's listener has
        // attached is silently lost. navigate() to the same route twice is a
        // harmless no-op, so repeating is safe.
        if let route = pendingScreenshotRoute {
            pendingScreenshotRoute = nil
            for delay in [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0] {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                    self?.deliverScreenshotRoute(route)
                }
            }
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    // MARK: - Home Screen Quick Actions (long-press app icon)

    func application(_ application: UIApplication,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let action = mapShortcutType(shortcutItem.type)
        deliverAction(action)
        completionHandler(true)
    }

    /// Translates the Info.plist shortcut type identifier to a stable JS event payload.
    private func mapShortcutType(_ rawType: String) -> String {
        // Strip our bundle prefix if present (Apple recommends reverse-DNS for shortcut types).
        if let dot = rawType.lastIndex(of: ".") {
            return String(rawType[rawType.index(after: dot)...])
        }
        return rawType
    }

    /// Bridge a native action into the Capacitor webview as a CustomEvent.
    /// Goes through the underlying WKWebView so we don't depend on the exact
    /// `bridge.eval(js:)` signature, which has shifted between Capacitor majors.
    private func deliverAction(_ action: String) {
        let js = "window.dispatchEvent(new CustomEvent('hasatlink:quickAction', { detail: '\(action)' }));"

        if let webView = capacitorWebView() {
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    /// CI-only bridge for automated App Store screenshot capture
    /// (see scripts/capture-ios-screenshots.mjs). Navigates the webview straight
    /// to a route path rather than mapping through a named action.
    private func deliverScreenshotRoute(_ route: String) {
        let js = "window.dispatchEvent(new CustomEvent('hasatlink:screenshotRoute', { detail: '\(route)' }));"
        capacitorWebView()?.evaluateJavaScript(js, completionHandler: nil)
    }

    private func capacitorWebView() -> WKWebView? {
        if let vc = window?.rootViewController as? CAPBridgeViewController,
           let webView = vc.bridge?.webView {
            return webView
        }
        for scene in UIApplication.shared.connectedScenes {
            guard let windowScene = scene as? UIWindowScene else { continue }
            for w in windowScene.windows {
                if let vc = w.rootViewController as? CAPBridgeViewController,
                   let webView = vc.bridge?.webView {
                    return webView
                }
            }
        }
        return nil
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if facebookConfigured,
           ApplicationDelegate.shared.application(
               app,
               open: url,
               sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as? String,
               annotation: options[UIApplication.OpenURLOptionsKey.annotation]
           ) {
            return true
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// MARK: - App Intents (iOS 16+) — Siri Shortcuts, Spotlight, Action Button

#if canImport(AppIntents)
@available(iOS 16.0, *)
struct AddListingIntent: AppIntent {
    static var title: LocalizedStringResource = "Yeni İlan Ekle"
    static var description = IntentDescription("HasatLink'te yeni satış ilanı oluşturmak için uygulamayı aç.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set("addListing", forKey: "HasatLinkPendingAction")
        return .result()
    }
}

@available(iOS 16.0, *)
struct BrowseMarketIntent: AppIntent {
    static var title: LocalizedStringResource = "Pazar Fiyatlarını Aç"
    static var description = IntentDescription("HasatLink Pazar'da güncel fiyatları görüntüle.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set("browseMarket", forKey: "HasatLinkPendingAction")
        return .result()
    }
}

@available(iOS 16.0, *)
struct DiagnoseDiseaseIntent: AppIntent {
    static var title: LocalizedStringResource = "AI Hastalık Teşhisi"
    static var description = IntentDescription("Bitki yaprağı fotoğrafıyla hastalık teşhis ettir.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set("diagnose", forKey: "HasatLinkPendingAction")
        return .result()
    }
}

@available(iOS 16.0, *)
struct PriceAlertsIntent: AppIntent {
    static var title: LocalizedStringResource = "Fiyat Alarmlarım"
    static var description = IntentDescription("Aktif fiyat alarmlarını ve son tetiklenenleri görüntüle.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        UserDefaults.standard.set("priceAlerts", forKey: "HasatLinkPendingAction")
        return .result()
    }
}

@available(iOS 16.0, *)
struct HasatLinkAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddListingIntent(),
            phrases: [
                "\(.applicationName) ile ilan ekle",
                "\(.applicationName) yeni ilan",
                "\(.applicationName) sat"
            ],
            shortTitle: "İlan Ekle",
            systemImageName: "plus.circle.fill"
        )
        AppShortcut(
            intent: BrowseMarketIntent(),
            phrases: [
                "\(.applicationName) pazar fiyatları",
                "\(.applicationName) market",
                "\(.applicationName) fiyatları göster"
            ],
            shortTitle: "Pazar Fiyatları",
            systemImageName: "chart.line.uptrend.xyaxis"
        )
        AppShortcut(
            intent: DiagnoseDiseaseIntent(),
            phrases: [
                "\(.applicationName) hastalık teşhis",
                "\(.applicationName) bitki tara",
                "\(.applicationName) yaprak teşhis"
            ],
            shortTitle: "Hastalık Teşhisi",
            systemImageName: "leaf.fill"
        )
        AppShortcut(
            intent: PriceAlertsIntent(),
            phrases: [
                "\(.applicationName) fiyat alarmları",
                "\(.applicationName) alarm"
            ],
            shortTitle: "Fiyat Alarmları",
            systemImageName: "bell.badge.fill"
        )
    }
}
#endif
