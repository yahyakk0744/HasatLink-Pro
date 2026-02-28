import SEO from '../components/ui/SEO';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <SEO
        title="Çerez Politikası"
        description="HasatLink çerez (cookie) politikası — hangi çerezlerin kullanıldığı ve neden kullanıldığı hakkında bilgilendirme."
      />
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Çerez Politikası</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">Son güncelleme: 28 Şubat 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[var(--text-primary)]">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Çerez Nedir?</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Çerezler (cookies), web sitelerinin tarayıcınıza gönderdiği ve cihazınızda saklanan küçük metin dosyalarıdır. Çerezler, web sitesinin düzgün çalışmasını, güvenliğini ve kullanıcı deneyiminin iyileştirilmesini sağlamak amacıyla yaygın olarak kullanılmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Kullandığımız Çerez ve Depolama Teknolojileri</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-4">
            HasatLink platformu aşağıdaki çerez ve yerel depolama teknolojilerini kullanmaktadır:
          </p>

          <div className="space-y-4">
            <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
              <div className="bg-[var(--bg-input)] px-4 py-2">
                <h3 className="font-semibold text-sm">Zorunlu Çerezler / Yerel Depolama</h3>
                <p className="text-xs text-[var(--text-secondary)]">Bu teknolojiler platformun çalışması için gereklidir ve devre dışı bırakılamaz.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left px-4 py-2 font-medium">Ad</th>
                      <th className="text-left px-4 py-2 font-medium">Tür</th>
                      <th className="text-left px-4 py-2 font-medium">Amaç</th>
                      <th className="text-left px-4 py-2 font-medium">Süre</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-primary)]">
                    <tr className="border-b border-[var(--border-default)]">
                      <td className="px-4 py-2 font-mono text-xs">hasatlink_token</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Kullanıcı oturum kimlik doğrulama token'ı (JWT). Giriş yaptıktan sonra oturumunuzun açık kalmasını sağlar.</td>
                      <td className="px-4 py-2">30 gün</td>
                    </tr>
                    <tr className="border-b border-[var(--border-default)]">
                      <td className="px-4 py-2 font-mono text-xs">hasatlink_user</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Kullanıcı profil bilgileri (isim, profil resmi vb.). Sayfa yenilendiğinde hızlı yükleme sağlar.</td>
                      <td className="px-4 py-2">Oturum boyunca</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">hasatlink_cookie_consent</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Çerez tercih durumunuz (kabul/red). Çerez bildiriminin tekrar gösterilmesini engeller.</td>
                      <td className="px-4 py-2">Süresiz</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
              <div className="bg-[var(--bg-input)] px-4 py-2">
                <h3 className="font-semibold text-sm">İşlevsel Çerezler / Yerel Depolama</h3>
                <p className="text-xs text-[var(--text-secondary)]">Tercihlerinizi hatırlamak ve deneyiminizi kişiselleştirmek için kullanılır.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left px-4 py-2 font-medium">Ad</th>
                      <th className="text-left px-4 py-2 font-medium">Tür</th>
                      <th className="text-left px-4 py-2 font-medium">Amaç</th>
                      <th className="text-left px-4 py-2 font-medium">Süre</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-primary)]">
                    <tr className="border-b border-[var(--border-default)]">
                      <td className="px-4 py-2 font-mono text-xs">i18nextLng</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Dil tercihiniz (Türkçe/İngilizce). Platform dilinin hatırlanmasını sağlar.</td>
                      <td className="px-4 py-2">Süresiz</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">hasatlink_theme</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Tema tercihiniz (açık/koyu mod). Görünüm ayarınızın hatırlanmasını sağlar.</td>
                      <td className="px-4 py-2">Süresiz</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[var(--border-default)] rounded-xl overflow-hidden">
              <div className="bg-[var(--bg-input)] px-4 py-2">
                <h3 className="font-semibold text-sm">Üçüncü Taraf Çerezleri</h3>
                <p className="text-xs text-[var(--text-secondary)]">Üçüncü taraf hizmetleri tarafından ayarlanan çerezler.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="text-left px-4 py-2 font-medium">Sağlayıcı</th>
                      <th className="text-left px-4 py-2 font-medium">Amaç</th>
                      <th className="text-left px-4 py-2 font-medium">Detay</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-primary)]">
                    <tr>
                      <td className="px-4 py-2 font-medium">Google Firebase</td>
                      <td className="px-4 py-2">Kimlik doğrulama</td>
                      <td className="px-4 py-2">Google ile giriş yapılması halinde Firebase Authentication çerezleri kullanılabilir. Bu çerezler Google'ın gizlilik politikasına tabidir.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Kullanılmayan Teknolojiler</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            HasatLink aşağıdaki teknolojileri <strong>kullanmamaktadır</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Üçüncü taraf reklam izleme çerezleri</li>
            <li>Davranışsal hedefleme çerezleri</li>
            <li>Sosyal medya izleme pikselleri</li>
            <li>Çapraz site izleme (cross-site tracking) teknolojileri</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Çerezleri Yönetme</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            Çerez tercihlerinizi aşağıdaki yöntemlerle yönetebilirsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-primary)]">
            <li>
              <strong>Tarayıcı ayarları:</strong> Tarayıcınızın ayarlarından çerezleri görüntüleyebilir, silebilir veya engelleyebilirsiniz. Her tarayıcının çerez yönetim yöntemi farklıdır; detaylar için tarayıcınızın yardım bölümüne başvurabilirsiniz.
            </li>
            <li>
              <strong>Yerel depolama temizleme:</strong> Tarayıcınızın geliştirici araçları veya ayarlar menüsünden localStorage verilerini temizleyebilirsiniz.
            </li>
            <li>
              <strong>Platform üzerinden:</strong> İlk ziyaretinizde gösterilen çerez bildiriminden tercihlerinizi belirleyebilirsiniz.
            </li>
          </ul>
          <div className="mt-3 p-4 rounded-xl bg-[#A47148]/5 border border-[#A47148]/20 text-sm">
            <p className="font-semibold text-[#A47148] mb-1">Uyarı</p>
            <p className="text-[var(--text-primary)]">
              Zorunlu çerezleri ve yerel depolama verilerini silmeniz halinde oturumunuz sonlandırılır ve platformu kullanmak için yeniden giriş yapmanız gerekir.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Veri Güvenliği</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Çerezler ve yerel depolama aracılığıyla saklanan veriler, platform güvenlik protokolleri kapsamında korunmaktadır. Oturum token'ları (JWT) kriptografik olarak imzalanmıştır ve sunucu tarafında doğrulanmaktadır. Hassas veriler (şifreler gibi) hiçbir zaman çerezlerde veya yerel depolama alanında düz metin olarak saklanmaz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Politika Değişiklikleri</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink, bu Çerez Politikasını güncelleyebilir. Değişiklikler bu sayfada yayınlanarak yürürlüğe girer. Yeni çerez türlerinin eklenmesi halinde çerez bildirimini yeniden göstererek onayınızı alacağız.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. İletişim</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Çerez politikamız hakkında sorularınız için:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[var(--bg-input)] text-sm space-y-1">
            <p><strong>E-posta:</strong> destek@hasatlink.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
