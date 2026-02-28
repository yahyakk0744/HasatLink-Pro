import SEO from '../components/ui/SEO';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <SEO
        title="Gizlilik Politikası & KVKK Aydınlatma Metni"
        description="HasatLink gizlilik politikası, KVKK aydınlatma metni ve kişisel verilerin korunması hakkında bilgilendirme."
      />
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Gizlilik Politikası</h1>
      <h2 className="text-lg text-[var(--text-secondary)] mb-8">KVKK Aydınlatma Metni</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-8">Son güncelleme: 28 Şubat 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[var(--text-primary)]">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Veri Sorumlusu</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink platformu ("Platform") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda; hukuka ve dürüstlük kurallarına uygun bir şekilde işlemekte, saklamakta ve aktarmaktayız.
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mt-2">
            HasatLink, tarım sektöründe alıcı ve satıcıları buluşturan bir <strong>ilan platformudur</strong>. Platform üzerinden gerçekleştirilen işlemler tamamen kullanıcılar arasında yürütülmekte olup, HasatLink yalnızca ilanların yayınlanması için bir aracı hizmeti sunmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Toplanan Kişisel Veriler</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-3">
            Platform üzerinden aşağıdaki kişisel verileriniz toplanmakta ve işlenmektedir:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th className="text-left py-2 pr-4 font-semibold">Veri Kategorisi</th>
                  <th className="text-left py-2 font-semibold">Toplanan Veriler</th>
                </tr>
              </thead>
              <tbody className="text-[var(--text-primary)]">
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">Kimlik Bilgileri</td>
                  <td className="py-2">Ad, soyad</td>
                </tr>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">İletişim Bilgileri</td>
                  <td className="py-2">E-posta adresi, telefon numarası</td>
                </tr>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">Konum Bilgileri</td>
                  <td className="py-2">İl, ilçe bazında konum bilgisi (ilan oluşturma ve harita işlevleri için)</td>
                </tr>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">Hesap Bilgileri</td>
                  <td className="py-2">Profil fotoğrafı, biyografi, dil tercihi, şifre (hash'lenmiş)</td>
                </tr>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">İlan Verileri</td>
                  <td className="py-2">İlan başlığı, açıklaması, fotoğrafları, fiyat bilgileri</td>
                </tr>
                <tr className="border-b border-[var(--border-default)]">
                  <td className="py-2 pr-4 font-medium">İletişim Verileri</td>
                  <td className="py-2">Platform üzerinden gönderilen mesajlar</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Kullanım Verileri</td>
                  <td className="py-2">Sayfa görüntüleme, tıklama istatistikleri, oturum bilgileri</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Kişisel Verilerin Toplanma Yöntemi</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Platform üzerinden hesap oluşturma ve profil güncelleme formları aracılığıyla</li>
            <li>Google hesabı ile giriş yapmanız halinde Google Firebase kimlik doğrulama servisi aracılığıyla</li>
            <li>İlan oluşturma ve düzenleme süreçlerinde</li>
            <li>Platform içi mesajlaşma sistemi aracılığıyla</li>
            <li>İletişim formu üzerinden</li>
            <li>Çerezler ve benzeri teknolojiler aracılığıyla (otomatik olarak)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Kişisel Verilerin İşlenme Amaçları</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Kullanıcı hesabının oluşturulması, kimlik doğrulama ve oturum yönetimi</li>
            <li>İlan yayınlama, düzenleme ve yönetim hizmetlerinin sunulması</li>
            <li>Kullanıcılar arası iletişimin sağlanması</li>
            <li>Hal fiyatları, pazar verileri ve hava durumu bilgilerinin sunulması</li>
            <li>AI bitki teşhis hizmetinin sağlanması</li>
            <li>Konum bazlı ilan arama ve harita hizmetlerinin sunulması</li>
            <li>Platform güvenliğinin sağlanması ve dolandırıcılığın önlenmesi</li>
            <li>Kullanıcı destek taleplerinin karşılanması</li>
            <li>Hizmet kalitesinin iyileştirilmesi ve istatistiksel analizler</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Kişisel Verilerin İşlenme Hukuki Sebebi</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            KVKK'nın 5. maddesi uyarınca kişisel verileriniz aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li><strong>Açık rıza:</strong> Hesap oluşturma sırasında ve çerez kullanımı için verdiğiniz onay</li>
            <li><strong>Sözleşmenin ifası:</strong> Platform hizmetlerinin sağlanması için gerekli veri işleme</li>
            <li><strong>Meşru menfaat:</strong> Platform güvenliğinin sağlanması, hizmet iyileştirme</li>
            <li><strong>Hukuki yükümlülük:</strong> Yasal düzenlemeler kapsamında zorunlu veri saklama</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Kişisel Verilerin Korunması</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki teknik ve idari tedbirler alınmaktadır:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Şifreler bcrypt algoritması ile hash'lenerek saklanır; hiçbir koşulda düz metin olarak tutulmaz</li>
            <li>Tüm veri iletişimi SSL/TLS (HTTPS) şifreleme ile korunur</li>
            <li>Yetkisiz erişime karşı JWT (JSON Web Token) tabanlı kimlik doğrulama sistemi kullanılır</li>
            <li>Sunucu tarafında IP bazlı istek sınırlandırma (rate limiting) uygulanır</li>
            <li>Veritabanı erişimi yetkilendirme ile kısıtlanmıştır</li>
            <li>Düzenli güvenlik güncellemeleri ve izleme yapılmaktadır</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Kişisel Verilerin Aktarılması</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            Kişisel verileriniz, hizmet kalitesinin sağlanması amacıyla aşağıdaki üçüncü taraf hizmet sağlayıcılarla paylaşılabilmektedir:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-primary)]">
            <li><strong>Google Firebase:</strong> Kimlik doğrulama hizmetleri (Google ile giriş). Google'ın gizlilik politikası kapsamında işlenir.</li>
            <li><strong>MongoDB Atlas:</strong> Veritabanı barındırma hizmeti. Veriler şifrelenmiş olarak saklanır.</li>
            <li><strong>OpenWeatherMap:</strong> Hava durumu verileri için konum bilgisi paylaşılır.</li>
          </ul>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mt-2">
            Kişisel verileriniz, yukarıda belirtilen durumlar dışında açık rızanız olmaksızın üçüncü kişilere aktarılmaz. Yasal zorunluluk halleri saklıdır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Kişisel Verilerin Saklanma Süresi</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Hesap bilgileriniz, hesabınız aktif olduğu sürece saklanır</li>
            <li>Hesap silme talebiniz halinde verileriniz 30 gün içinde sistemlerimizden kalıcı olarak silinir</li>
            <li>İlan verileri, ilan aktif olduğu sürece ve silinmesinin ardından 30 gün daha saklanır</li>
            <li>Kullanım istatistikleri anonim hale getirilerek süresiz saklanabilir</li>
            <li>Yasal yükümlülükler kapsamında bazı veriler mevzuatın öngördüğü süre boyunca saklanabilir</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. KVKK Kapsamında Haklarınız</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
            <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
            <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
            <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme ve silme işlemlerinin kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Çerezler (Cookies)</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Platformumuz, oturum yönetimi ve kullanıcı deneyimini iyileştirmek amacıyla çerezler ve benzeri teknolojiler kullanmaktadır. Çerez kullanımımıza ilişkin detaylı bilgi için{' '}
            <a href="/cerez-politikasi" className="text-[#2D6A4F] underline hover:no-underline">Çerez Politikası</a>{' '}
            sayfamızı ziyaret edebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Politika Değişiklikleri</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink, bu Gizlilik Politikası ve KVKK Aydınlatma Metni'ni güncelleyebilir. Değişiklikler bu sayfada yayınlanarak yürürlüğe girer. Önemli değişiklikler yapılması halinde platform üzerinden bildirim yapılır. Güncellenmiş politikayı düzenli olarak kontrol etmenizi öneririz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Başvuru ve İletişim</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki kanallardan bize başvurabilirsiniz:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[var(--bg-input)] text-sm space-y-1">
            <p><strong>E-posta:</strong> kvkk@hasatlink.com</p>
            <p><strong>Genel İletişim:</strong> destek@hasatlink.com</p>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mt-3">
            Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır. İşlemin ayrıca bir maliyet gerektirmesi halinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
          </p>
        </section>
      </div>
    </div>
  );
}
