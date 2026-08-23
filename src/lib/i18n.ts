export type Locale = "tr-TR" | "en-US" | "de-DE";

export const supportedLocales: Locale[] = ["tr-TR", "en-US", "de-DE"];

export function normalizeLocale(value: string | null | undefined): Locale {
  return value === "en-US" || value === "de-DE" ? value : "tr-TR";
}

type TranslationKey =
  | "home"
  | "discover"
  | "lists"
  | "hype"
  | "search"
  | "searchPlaceholder"
  | "login"
  | "signup"
  | "profile"
  | "settings"
  | "support"
  | "dashboard"
  | "myPlaylists"
  | "about"
  | "contact"
  | "terms"
  | "privacy"
  | "platformTagline"
  | "musicPlatform"
  | "closeMenu"
  | "language"
  | "theme"
  | "lightTheme"
  | "darkTheme"
  | "homePage"
  | "quickActions"
  | "quickActionsDescription"
  | "newRelease"
  | "newReleaseDescription"
  | "analytics"
  | "analyticsDescription"
  | "financeReports"
  | "financeReportsDescription"
  | "discoverDescription"
  | "greetingMorning"
  | "greetingDay"
  | "greetingEvening"
  | "artistAccount"
  | "labelAccount"
  | "creatorAccount"
  | "artistAccountDescription"
  | "labelAccountDescription"
  | "creatorAccountDescription"
  | "explore"
  | "supportCenter"
  | "workingArea"
  | "artistTools"
  | "labelTools"
  | "creatorTools"
  | "activeWorkspace"
  | "applicationRequired"
  | "artistChannels"
  | "artistChannelsDescription"
  | "manageArtists"
  | "goToProfileSettings"
  | "openProfile"
  | "edit"
  | "verifiedArtist"
  | "artistProfile"
  | "release"
  | "followers"
  | "link"
  | "noArtistProfile"
  | "growthSnapshot"
  | "musicMovement"
  | "growthDescription"
  | "openGrowthTools"
  | "activeSmartLink"
  | "smartLinkViews"
  | "platformClicks"
  | "audienceSignal"
  | "countryReach"
  | "cityReach"
  | "socialSources"
  | "latestReleases"
  | "latestReleasesDescription"
  | "seeAll"
  | "artistNotSpecified"
  | "releaseAccess"
  | "verifyArtistProfile"
  | "applyArtist"
  | "noReviewPending"
  | "reviewPending"
  | "distributionHealthy"
  | "distributionNeedsReview"
  | "artistProfileWorkspace"
  | "artistProfileWorkspaceDescription"
  | "prepareRelease"
  | "prepareReleaseDescription"
  | "createSmartLink"
  | "createSmartLinkDescription"
  | "artistAnalytics"
  | "artistAnalyticsDescription"
  | "manageArtistChannels"
  | "manageArtistChannelsDescription"
  | "labelOrganization"
  | "labelOrganizationDescription"
  | "prepareDistribution"
  | "prepareDistributionDescription"
  | "artistApplication"
  | "artistApplicationDescription"
  | "organizationApplication"
  | "organizationApplicationDescription"
  | "enableCreatorTools"
  | "enableCreatorToolsDescription"
  | "inviteMembers"
  | "inviteMembersDescription"
  | "createMember"
  | "createMemberDescription"
  | "authHeroTitle"
  | "authHeroDescription"
  | "authProviders"
  | "authMetadata"
  | "authArchitecture"
  | "authCleanModular"
  | "signInEyebrow"
  | "signInTitle"
  | "signInDescription"
  | "signInFooterText"
  | "createAccount"
  | "signUpEyebrow"
  | "signUpTitle"
  | "signUpDescription"
  | "signUpFooterText"
  | "email"
  | "password"
  | "passwordPlaceholder"
  | "signInPending"
  | "emailOrPasswordInvalid"
  | "accountMissing"
  | "signUpPending"
  | "signUpError"
  | "name"
  | "termsAcceptance"
  | "passwordHint"
  | "confirmPassword"
  | "confirmPasswordPlaceholder"
  | "accountCreatedOtpFailed"
  | "googleContinue"
  | "facebookContinue"
  | "googleSignUp"
  | "facebookSignUp"
  | "alreadyHaveAccount"
  | "accountSecurity"
  | "verifyEmailTitle"
  | "verifyEmailDescription"
  | "verificationCode"
  | "verifyEmail"
  | "verifyEmailPending"
  | "sendNewCode"
  | "resendCode"
  | "codeValidity"
  | "backToSignIn"
  | "twoFactor"
  | "verifyLoginTitle"
  | "verifyLoginDescription"
  | "trustDevice"
  | "trustDeviceDescription"
  | "verifyLogin"
  | "verifyLoginChecking"
  | "verifyLoginSuccess"
  | "verifyLoginPreparing"
  | "restartLogin";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  "tr-TR": {
    home: "Ana Sayfa", discover: "Keşfet", lists: "Listeler", hype: "Hype", search: "Ara",
    searchPlaceholder: "Şarkı, sanatçı veya albüm ara...", login: "Giriş yap", signup: "Üye ol", profile: "Profil",
    settings: "Ayarlar", support: "Destek merkezi", dashboard: "Dashboard", myPlaylists: "Playlistlerim",
    about: "Hakkımızda", contact: "İletişim", terms: "Kullanım koşulları", privacy: "Gizlilik",
    platformTagline: "Müziğin radarı · Yayın ve keşif platformu", musicPlatform: "Music Platform", closeMenu: "Menüyü kapat",
    language: "Dil", theme: "Tema", lightTheme: "Açık temaya geç", darkTheme: "Koyu temaya geç", homePage: "Ana sayfa",
    quickActions: "Hızlı işlemler", quickActionsDescription: "Sık kullandığın Radarune araçlarına doğrudan ulaş",
    newRelease: "Yeni yayın", newReleaseDescription: "Yeni bir single, EP veya albüm hazırla.", analytics: "Analizler",
    analyticsDescription: "Kataloğunun performans verilerini incele.", financeReports: "Finans raporları",
    financeReportsDescription: "Dinlenme ve gelir raporlarını görüntüle.", discoverDescription: "Yeni müzikleri keşfet ve topluluğa katıl.",
    greetingMorning: "Günaydın", greetingDay: "İyi günler", greetingEvening: "İyi akşamlar", artistAccount: "Sanatçı hesabı",
    labelAccount: "Label / organizatör hesabı", creatorAccount: "Creator hesabı", artistAccountDescription: "Kendi sanatçı kanalını, yayınlarını ve performansını yönet.",
    labelAccountDescription: "Bağlı sanatçıları, şirket kataloğunu ve dağıtımı tek merkezden yönet.", creatorAccountDescription: "Profilini tamamla, sanatçı veya organizatör olarak yayın araçlarını aç.",
    explore: "Keşfet", supportCenter: "Destek merkezi", workingArea: "Çalışma alanı", artistTools: "Sanatçı araçları",
    labelTools: "Label ve organizasyon araçları", creatorTools: "Radarune Creator", activeWorkspace: "Aktif çalışma alanı",
    applicationRequired: "Başvuru gerekli", artistChannels: "Sanatçı kanalların", artistChannelsDescription: "Profil, yayın, oy ve bağlantı yönetimine buradan geç.",
    manageArtists: "Tüm sanatçıları yönet", goToProfileSettings: "Profil ayarlarına git", openProfile: "Profili aç", edit: "Düzenle",
    verifiedArtist: "Doğrulanmış sanatçı", artistProfile: "Sanatçı profili", release: "Yayın", followers: "Takipçi", link: "Link",
    noArtistProfile: "Henüz bağlı bir sanatçı profili yok. Yayın göndermek için önce sanatçı profilini oluştur.", growthSnapshot: "Growth snapshot",
    musicMovement: "Müziğinin Radarune’daki hareketi", growthDescription: "Smart Link ve keşif performansını tek bakışta takip et.", openGrowthTools: "Growth araçlarını aç →",
    activeSmartLink: "Aktif Smart Link", smartLinkViews: "Smart Link görüntülenmesi", platformClicks: "Platform tıklaması", audienceSignal: "Audience signal",
    countryReach: "Ülke bazlı erişim", cityReach: "Şehir bazlı erişim", socialSources: "Sosyal kaynaklar", latestReleases: "Son yayınlar",
    latestReleasesDescription: "Kataloğunda en son güncellenen çalışmalar", seeAll: "Tümünü gör", artistNotSpecified: "Sanatçı belirtilmedi",
    releaseAccess: "Yayın oluşturma erişimi", verifyArtistProfile: "Önce sanatçı profilini doğrula", applyArtist: "Sanatçı başvurusu yap",
    noReviewPending: "İnceleme bekleyen bir yayın bulunmuyor.", reviewPending: "yayın şu anda inceleme aşamasında.", distributionHealthy: "Dağıtım sistemleri çalışıyor.", distributionNeedsReview: "işlem kontrol bekliyor",
    artistProfileWorkspace: "Sanatçı profilim", artistProfileWorkspaceDescription: "Kanal görünümünü, kapak ve sosyal bağlantılarını düzenle.", prepareRelease: "Yayın hazırla", prepareReleaseDescription: "Yeni yayınını ve katalog akışını hazırla.", createSmartLink: "Smart Link oluştur", createSmartLinkDescription: "Spotify, Apple Music ve sosyal linklerini tek sayfada topla.", artistAnalytics: "Sanatçı analizleri", artistAnalyticsDescription: "Dinlenme, ülke, şehir ve gelir performansını incele.", manageArtistChannels: "Sanatçıları yönet", manageArtistChannelsDescription: "Bağlı sanatçı kanallarını ve doğrulama durumlarını yönet.", labelOrganization: "Label ve organizasyon", labelOrganizationDescription: "Şirket/label katalog yapısını düzenle.", prepareDistribution: "Dağıtım hazırlığı", prepareDistributionDescription: "Sanatçı kataloğu için yeni dağıtım hazırlığı başlat.", artistApplication: "Sanatçı ol", artistApplicationDescription: "Kendi kanalın ve yayın araçların için başvuru yap.", organizationApplication: "Organizasyon başvurusu", organizationApplicationDescription: "Label, menajerlik veya organizasyon hesabı için başvur.", enableCreatorTools: "Creator araçlarını aç", enableCreatorToolsDescription: "Ücretsiz Smart Link ve yayın araçlarını açmak için creator erişimi iste.", inviteMembers: "Üyeleri davet et", inviteMembersDescription: "Radarune topluluğuna yeni üyeler davet et.", createMember: "Üye oluştur", createMemberDescription: "Admin yetkinle ekip üyelerini ve erişimlerini oluştur.",
    authHeroTitle: "Müzik operasyonu, hak verisi ve dağıtım tek kontrol merkezinde.", authHeroDescription: "Radarune; yayın hazırlığı, dağıtım yönetimi ve provider akışını dağınık tablolar yerine tek bir üretim alanında toplar.", authProviders: "Sağlayıcılar", authMetadata: "Metadata", authArchitecture: "Mimari", authCleanModular: "Temiz, modüler", signInEyebrow: "Radarune erişimi", signInTitle: "Giriş yap", signInDescription: "Yayın operasyonu çalışma alanınıza, provider yönlendirmelerine ve katalog yönetim araçlarına erişin.", signInFooterText: "Henüz hesabınız yok mu?", createAccount: "Hesap oluştur", signUpEyebrow: "Radarune üyeliği", signUpTitle: "Hesap oluştur", signUpDescription: "Radarune hesabınızı oluşturun, yeni müzikleri keşfedin ve sanatçı başvurunuzu yönetin.", signUpFooterText: "Zaten hesabınız var mı?", email: "E-posta", password: "Şifre", passwordPlaceholder: "Şifrenizi girin", signInPending: "Giriş yapılıyor…", emailOrPasswordInvalid: "E-posta veya şifre hatalı.", accountMissing: "Hesabınız yok mu? Kayıt olun.", signUpPending: "Hesap oluşturuluyor…", signUpError: "Hesap oluşturulamadı.", name: "Ad soyad", termsAcceptance: "Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.", passwordHint: "En az 6 karakter kullanın.", confirmPassword: "Şifre tekrarı", confirmPasswordPlaceholder: "Şifrenizi tekrar girin", accountCreatedOtpFailed: "Hesap oluşturuldu ancak doğrulama kodu gönderilemedi.", googleContinue: "Google ile devam et", facebookContinue: "Facebook ile devam et", googleSignUp: "Google ile kayıt ol", facebookSignUp: "Facebook ile kayıt ol", alreadyHaveAccount: "Zaten hesabınız var mı? Giriş yapın.", accountSecurity: "Hesap güvenliği", verifyEmailTitle: "E-posta adresinizi doğrulayın", verifyEmailDescription: "E-posta adresinize gönderilen altı haneli doğrulama kodunu girin.", verificationCode: "Doğrulama kodu", verifyEmail: "E-postayı doğrula", verifyEmailPending: "Doğrulanıyor…", sendNewCode: "Yeni kod gönder", resendCode: "Tekrar gönder", codeValidity: "Kod 10 dakika geçerlidir. Beş yanlış denemeden sonra yeni kod istemeniz gerekir.", backToSignIn: "Giriş sayfasına dön", twoFactor: "İki adımlı doğrulama", verifyLoginTitle: "Girişinizi doğrulayın", verifyLoginDescription: "Şifreniz doğrulandı. Hesabınıza erişmek için e-postanıza gönderilen altı haneli güvenlik kodunu girin.", trustDevice: "Bu cihaza 30 gün güven", trustDeviceDescription: "Bu tarayıcıda 30 gün boyunca tekrar güvenlik kodu istenmez.", verifyLogin: "Girişi doğrula", verifyLoginChecking: "Güvenlik kodu doğrulanıyor", verifyLoginSuccess: "Kimlik doğrulandı", verifyLoginPreparing: "Güvenli oturumunuz hazırlanıyor…", restartLogin: "Giriş işlemini yeniden başlat",
  },
  "en-US": {
    home: "Home", discover: "Discover", lists: "Lists", hype: "Hype", search: "Search", searchPlaceholder: "Search songs, artists or albums...",
    login: "Sign in", signup: "Sign up", profile: "Profile", settings: "Settings", support: "Support center", dashboard: "Dashboard", myPlaylists: "My playlists",
    about: "About", contact: "Contact", terms: "Terms", privacy: "Privacy", platformTagline: "Your music radar · Release and discovery platform", musicPlatform: "Music Platform", closeMenu: "Close menu",
    language: "Language", theme: "Theme", lightTheme: "Switch to light theme", darkTheme: "Switch to dark theme", homePage: "Home", quickActions: "Quick actions", quickActionsDescription: "Jump straight to your most-used Radarune tools",
    newRelease: "New release", newReleaseDescription: "Prepare a new single, EP or album.", analytics: "Analytics", analyticsDescription: "Review your catalog performance.", financeReports: "Finance reports", financeReportsDescription: "View streaming and revenue reports.", discoverDescription: "Discover new music and join the community.",
    greetingMorning: "Good morning", greetingDay: "Good afternoon", greetingEvening: "Good evening", artistAccount: "Artist account", labelAccount: "Label / organizer account", creatorAccount: "Creator account", artistAccountDescription: "Manage your artist channel, releases and performance.", labelAccountDescription: "Manage linked artists, your company catalog and distribution in one place.", creatorAccountDescription: "Complete your profile and unlock artist or organizer publishing tools.",
    explore: "Discover", supportCenter: "Support center", workingArea: "Workspace", artistTools: "Artist tools", labelTools: "Label and organization tools", creatorTools: "Radarune Creator", activeWorkspace: "Active workspace", applicationRequired: "Application required", artistChannels: "Your artist channels", artistChannelsDescription: "Manage profiles, releases, votes and links from here.", manageArtists: "Manage all artists", goToProfileSettings: "Go to profile settings", openProfile: "Open profile", edit: "Edit", verifiedArtist: "Verified artist", artistProfile: "Artist profile", release: "Release", followers: "Followers", link: "Link", noArtistProfile: "No linked artist profile yet. Create an artist profile before submitting a release.",
    growthSnapshot: "Growth snapshot", musicMovement: "Your music on Radarune", growthDescription: "Track Smart Link and discovery performance at a glance.", openGrowthTools: "Open growth tools →", activeSmartLink: "Active Smart Link", smartLinkViews: "Smart Link views", platformClicks: "Platform clicks", audienceSignal: "Audience signal", countryReach: "Reach by country", cityReach: "Reach by city", socialSources: "Social sources", latestReleases: "Latest releases", latestReleasesDescription: "Your most recently updated catalog items", seeAll: "View all", artistNotSpecified: "Artist not specified", releaseAccess: "Release access", verifyArtistProfile: "Verify your artist profile first", applyArtist: "Apply as an artist", noReviewPending: "No release is waiting for review.", reviewPending: "release(s) are currently under review.", distributionHealthy: "Distribution systems are healthy.", distributionNeedsReview: "job(s) need review",
    artistProfileWorkspace: "My artist profile", artistProfileWorkspaceDescription: "Edit your channel view, artwork and social links.", prepareRelease: "Prepare a release", prepareReleaseDescription: "Prepare your new release and catalog workflow.", createSmartLink: "Create Smart Link", createSmartLinkDescription: "Collect Spotify, Apple Music and social links on one page.", artistAnalytics: "Artist analytics", artistAnalyticsDescription: "Review streams, countries, cities and revenue performance.", manageArtistChannels: "Manage artists", manageArtistChannelsDescription: "Manage linked artist channels and verification status.", labelOrganization: "Label and organization", labelOrganizationDescription: "Manage your company or label catalog structure.", prepareDistribution: "Prepare distribution", prepareDistributionDescription: "Start a new distribution workflow for an artist catalog.", artistApplication: "Become an artist", artistApplicationDescription: "Apply for your own channel and release tools.", organizationApplication: "Organization application", organizationApplicationDescription: "Apply for a label, management or organization account.", enableCreatorTools: "Unlock creator tools", enableCreatorToolsDescription: "Request creator access to unlock Smart Link and release tools.", inviteMembers: "Invite members", inviteMembersDescription: "Invite new members to the Radarune community.", createMember: "Create member", createMemberDescription: "Create team members and manage their access with admin rights.",
    authHeroTitle: "Music operations, rights data and distribution in one control center.", authHeroDescription: "Radarune brings release preparation, distribution management and provider workflows together in one production workspace.", authProviders: "Providers", authMetadata: "Metadata", authArchitecture: "Architecture", authCleanModular: "Clean, modular", signInEyebrow: "Radarune access", signInTitle: "Sign in", signInDescription: "Access your release workspace, provider routing and catalog management tools.", signInFooterText: "Don't have an account yet?", createAccount: "Create an account", signUpEyebrow: "Radarune membership", signUpTitle: "Create an account", signUpDescription: "Create your Radarune account, discover new music and manage your artist application.", signUpFooterText: "Already have an account?", email: "Email", password: "Password", passwordPlaceholder: "Enter your password", signInPending: "Signing in…", emailOrPasswordInvalid: "Invalid email or password.", accountMissing: "Don't have an account? Sign up.", signUpPending: "Creating account…", signUpError: "Could not create the account.", name: "Full name", termsAcceptance: "I accept the terms of use and privacy policy.", passwordHint: "Use at least 6 characters.", confirmPassword: "Confirm password", confirmPasswordPlaceholder: "Enter your password again", accountCreatedOtpFailed: "Account created, but the verification code could not be sent.", googleContinue: "Continue with Google", facebookContinue: "Continue with Facebook", googleSignUp: "Sign up with Google", facebookSignUp: "Sign up with Facebook", alreadyHaveAccount: "Already have an account? Sign in.", accountSecurity: "Account security", verifyEmailTitle: "Verify your email address", verifyEmailDescription: "Enter the six-digit verification code sent to your email address.", verificationCode: "Verification code", verifyEmail: "Verify email", verifyEmailPending: "Verifying…", sendNewCode: "Send new code", resendCode: "Resend", codeValidity: "The code is valid for 10 minutes. After five incorrect attempts, request a new code.", backToSignIn: "Back to sign in", twoFactor: "Two-factor authentication", verifyLoginTitle: "Verify your sign-in", verifyLoginDescription: "Your password was verified. Enter the six-digit security code sent to your email to access your account.", trustDevice: "Trust this device for 30 days", trustDeviceDescription: "You won't be asked for a security code again on this browser for 30 days.", verifyLogin: "Verify sign-in", verifyLoginChecking: "Verifying security code", verifyLoginSuccess: "Identity verified", verifyLoginPreparing: "Preparing your secure session…", restartLogin: "Restart sign-in",
  },
  "de-DE": {
    home: "Startseite", discover: "Entdecken", lists: "Listen", hype: "Hype", search: "Suchen", searchPlaceholder: "Songs, Künstler oder Alben suchen...", login: "Anmelden", signup: "Registrieren", profile: "Profil", settings: "Einstellungen", support: "Support-Center", dashboard: "Dashboard", myPlaylists: "Meine Playlists", about: "Über uns", contact: "Kontakt", terms: "Nutzungsbedingungen", privacy: "Datenschutz", platformTagline: "Dein Musikradar · Release- und Entdeckungsplattform", musicPlatform: "Music Platform", closeMenu: "Menü schließen", language: "Sprache", theme: "Design", lightTheme: "Helles Design aktivieren", darkTheme: "Dunkles Design aktivieren", homePage: "Startseite", quickActions: "Schnellzugriff", quickActionsDescription: "Direkter Zugriff auf deine meistgenutzten Radarune-Werkzeuge", newRelease: "Neuer Release", newReleaseDescription: "Bereite eine neue Single, EP oder ein Album vor.", analytics: "Analysen", analyticsDescription: "Analysiere die Leistung deines Katalogs.", financeReports: "Finanzberichte", financeReportsDescription: "Streaming- und Einnahmeberichte ansehen.", discoverDescription: "Neue Musik entdecken und der Community beitreten.", greetingMorning: "Guten Morgen", greetingDay: "Guten Tag", greetingEvening: "Guten Abend", artistAccount: "Künstlerkonto", labelAccount: "Label- / Organisator-Konto", creatorAccount: "Creator-Konto", artistAccountDescription: "Verwalte deinen Künstlerkanal, Releases und Leistungen.", labelAccountDescription: "Verwalte verbundene Künstler, Katalog und Distribution zentral.", creatorAccountDescription: "Vervollständige dein Profil und schalte Veröffentlichungswerkzeuge frei.", explore: "Entdecken", supportCenter: "Support-Center", workingArea: "Arbeitsbereich", artistTools: "Künstlerwerkzeuge", labelTools: "Label- und Organisationswerkzeuge", creatorTools: "Radarune Creator", activeWorkspace: "Aktiver Arbeitsbereich", applicationRequired: "Antrag erforderlich", artistChannels: "Deine Künstlerkanäle", artistChannelsDescription: "Profile, Releases, Stimmen und Links hier verwalten.", manageArtists: "Alle Künstler verwalten", goToProfileSettings: "Zu den Profileinstellungen", openProfile: "Profil öffnen", edit: "Bearbeiten", verifiedArtist: "Verifizierter Künstler", artistProfile: "Künstlerprofil", release: "Release", followers: "Follower", link: "Link", noArtistProfile: "Noch kein Künstlerprofil verknüpft. Erstelle zuerst ein Profil.", growthSnapshot: "Growth snapshot", musicMovement: "Deine Musik auf Radarune", growthDescription: "Smart-Link- und Discovery-Leistung auf einen Blick verfolgen.", openGrowthTools: "Growth-Werkzeuge öffnen →", activeSmartLink: "Aktiver Smart Link", smartLinkViews: "Smart-Link-Aufrufe", platformClicks: "Plattform-Klicks", audienceSignal: "Audience signal", countryReach: "Reichweite nach Land", cityReach: "Reichweite nach Stadt", socialSources: "Soziale Quellen", latestReleases: "Neueste Releases", latestReleasesDescription: "Zuletzt aktualisierte Katalogeinträge", seeAll: "Alle ansehen", artistNotSpecified: "Künstler nicht angegeben", releaseAccess: "Release-Zugriff", verifyArtistProfile: "Künstlerprofil zuerst verifizieren", applyArtist: "Als Künstler bewerben", noReviewPending: "Kein Release wartet auf Prüfung.", reviewPending: "Release(s) werden geprüft.", distributionHealthy: "Distributionssysteme arbeiten normal.", distributionNeedsReview: "Vorgang/Vorgänge benötigen Prüfung",
    artistProfileWorkspace: "Mein Künstlerprofil", artistProfileWorkspaceDescription: "Kanalansicht, Artwork und soziale Links bearbeiten.", prepareRelease: "Release vorbereiten", prepareReleaseDescription: "Bereite deinen neuen Release und den Katalog-Workflow vor.", createSmartLink: "Smart Link erstellen", createSmartLinkDescription: "Spotify-, Apple-Music- und soziale Links auf einer Seite sammeln.", artistAnalytics: "Künstleranalysen", artistAnalyticsDescription: "Streams, Länder, Städte und Einnahmen auswerten.", manageArtistChannels: "Künstler verwalten", manageArtistChannelsDescription: "Verbundene Künstlerkanäle und Verifizierungsstatus verwalten.", labelOrganization: "Label und Organisation", labelOrganizationDescription: "Struktur deines Unternehmens- oder Labelkatalogs verwalten.", prepareDistribution: "Distribution vorbereiten", prepareDistributionDescription: "Einen neuen Distributionsworkflow für einen Künstlerkatalog starten.", artistApplication: "Künstler werden", artistApplicationDescription: "Beantrage deinen eigenen Kanal und Release-Werkzeuge.", organizationApplication: "Organisationsantrag", organizationApplicationDescription: "Beantrage ein Label-, Management- oder Organisationskonto.", enableCreatorTools: "Creator-Werkzeuge freischalten", enableCreatorToolsDescription: "Creator-Zugriff für Smart Link- und Release-Werkzeuge anfordern.", inviteMembers: "Mitglieder einladen", inviteMembersDescription: "Neue Mitglieder in die Radarune-Community einladen.", createMember: "Mitglied erstellen", createMemberDescription: "Teammitglieder erstellen und ihre Zugriffsrechte verwalten.",
    authHeroTitle: "Musikbetrieb, Rechte und Distribution in einem Kontrollzentrum.", authHeroDescription: "Radarune bündelt Release-Vorbereitung, Distributionsverwaltung und Provider-Abläufe in einem Produktionsbereich.", authProviders: "Anbieter", authMetadata: "Metadaten", authArchitecture: "Architektur", authCleanModular: "Sauber, modular", signInEyebrow: "Radarune-Zugang", signInTitle: "Anmelden", signInDescription: "Greife auf deinen Release-Arbeitsbereich, Provider-Routing und Katalogwerkzeuge zu.", signInFooterText: "Noch kein Konto?", createAccount: "Konto erstellen", signUpEyebrow: "Radarune-Mitgliedschaft", signUpTitle: "Konto erstellen", signUpDescription: "Erstelle dein Radarune-Konto, entdecke neue Musik und verwalte deine Künstlerbewerbung.", signUpFooterText: "Du hast bereits ein Konto?", email: "E-Mail", password: "Passwort", passwordPlaceholder: "Passwort eingeben", signInPending: "Anmeldung läuft…", emailOrPasswordInvalid: "E-Mail oder Passwort ist ungültig.", accountMissing: "Noch kein Konto? Jetzt registrieren.", signUpPending: "Konto wird erstellt…", signUpError: "Konto konnte nicht erstellt werden.", name: "Vollständiger Name", termsAcceptance: "Ich akzeptiere die Nutzungsbedingungen und die Datenschutzerklärung.", passwordHint: "Mindestens 6 Zeichen verwenden.", confirmPassword: "Passwort wiederholen", confirmPasswordPlaceholder: "Passwort erneut eingeben", accountCreatedOtpFailed: "Konto erstellt, aber der Bestätigungscode konnte nicht gesendet werden.", googleContinue: "Mit Google fortfahren", facebookContinue: "Mit Facebook fortfahren", googleSignUp: "Mit Google registrieren", facebookSignUp: "Mit Facebook registrieren", alreadyHaveAccount: "Du hast bereits ein Konto? Anmelden.", accountSecurity: "Kontosicherheit", verifyEmailTitle: "E-Mail-Adresse bestätigen", verifyEmailDescription: "Gib den sechsstelligen Bestätigungscode ein, den wir an deine E-Mail-Adresse gesendet haben.", verificationCode: "Bestätigungscode", verifyEmail: "E-Mail bestätigen", verifyEmailPending: "Wird bestätigt…", sendNewCode: "Neuen Code senden", resendCode: "Erneut senden", codeValidity: "Der Code ist 10 Minuten gültig. Nach fünf falschen Versuchen musst du einen neuen Code anfordern.", backToSignIn: "Zur Anmeldung", twoFactor: "Zwei-Faktor-Authentifizierung", verifyLoginTitle: "Anmeldung bestätigen", verifyLoginDescription: "Dein Passwort wurde bestätigt. Gib den sechsstelligen Sicherheitscode aus deiner E-Mail ein, um auf dein Konto zuzugreifen.", trustDevice: "Diesem Gerät 30 Tage vertrauen", trustDeviceDescription: "In diesem Browser wird 30 Tage lang kein Sicherheitscode mehr verlangt.", verifyLogin: "Anmeldung bestätigen", verifyLoginChecking: "Sicherheitscode wird geprüft", verifyLoginSuccess: "Identität bestätigt", verifyLoginPreparing: "Sichere Sitzung wird vorbereitet…", restartLogin: "Anmeldung neu starten",
  },
};

export function t(locale: string | null | undefined, key: TranslationKey): string {
  return translations[normalizeLocale(locale)][key];
}

/**
 * Small page-level translations for copy that is not part of the shared chrome.
 * Keeping these local to the page avoids silently falling back to Turkish when
 * a public page has not yet been added to the main dictionary.
 */
export function localize(
  locale: string | null | undefined,
  values: { tr: string; en: string; de: string },
): string {
  const normalized = normalizeLocale(locale);
  return normalized === "en-US" ? values.en : normalized === "de-DE" ? values.de : values.tr;
}

export type { TranslationKey };
