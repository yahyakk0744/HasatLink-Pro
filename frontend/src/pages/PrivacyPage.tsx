import { useTranslation } from 'react-i18next';
import SEO from '../components/ui/SEO';

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <SEO
        title={isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}
        description={isTr ? 'HasatLink gizlilik politikası ve kişisel verilerin korunması.' : 'HasatLink privacy policy and data protection.'}
      />
      <h1 className="text-3xl font-semibold tracking-tight mb-8">
        {isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        {isTr ? 'Son güncelleme: 28 Şubat 2026' : 'Last updated: February 28, 2026'}
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[var(--text-primary)]">
        {isTr ? (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Giriş</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink ("biz", "platform") olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, HasatLink platformunu kullanırken kişisel verilerinizin nasıl toplandığını, kullanıldığını, saklandığını ve korunduğunu açıklar. Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Toplanan Veriler</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">Platformumuz aşağıdaki kişisel verileri toplar:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
                <li><strong>Konum Bilgileri:</strong> İl, ilçe bazında konum (ilan oluşturma ve harita işlevleri için)</li>
                <li><strong>Profil Bilgileri:</strong> Profil fotoğrafı, biyografi, dil tercihi</li>
                <li><strong>İlan Verileri:</strong> Oluşturduğunuz ilanların içeriği, fotoğrafları ve fiyat bilgileri</li>
                <li><strong>İletişim Verileri:</strong> Platform üzerinden gönderilen mesajlar</li>
                <li><strong>Kullanım Verileri:</strong> Görüntüleme sayıları, tıklama istatistikleri</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Verilerin Kullanım Amaçları</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">Topladığımız veriler aşağıdaki amaçlarla kullanılır:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Hesap oluşturma ve kimlik doğrulama</li>
                <li>İlan yayınlama ve yönetimi</li>
                <li>Kullanıcılar arası iletişim sağlama</li>
                <li>Hal fiyatları ve pazar verileri sunma</li>
                <li>AI bitki teşhis hizmeti sağlama</li>
                <li>Hava durumu uyarıları gönderme</li>
                <li>Platform güvenliği ve dolandırıcılık önleme</li>
                <li>Hizmet kalitesini iyileştirme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Veri Güvenliği</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Kişisel verileriniz endüstri standardı güvenlik önlemleri ile korunmaktadır. Şifreleriniz bcrypt algoritması ile hash'lenerek saklanır. Tüm veri transferleri SSL/TLS şifreleme ile gerçekleştirilir. Yetkisiz erişime karşı JWT tabanlı kimlik doğrulama sistemi kullanılmaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Üçüncü Taraf Hizmetler</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">Platformumuz aşağıdaki üçüncü taraf hizmetleri kullanmaktadır:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li><strong>Google Firebase:</strong> Kimlik doğrulama (Google ile giriş)</li>
                <li><strong>OpenWeatherMap:</strong> Hava durumu verileri</li>
                <li><strong>İzmir Büyükşehir Belediyesi API:</strong> Hal fiyatları</li>
                <li><strong>MongoDB Atlas:</strong> Veri depolama</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Çerezler</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Platformumuz oturum yönetimi için JWT token kullanır. Bu tokenlar tarayıcınızın yerel depolama alanında saklanır. Üçüncü taraf izleme çerezleri kullanılmamaktadır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Kullanıcı Hakları</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmiş verileriniz hakkında bilgi talep etme</li>
                <li>Verilerinizin düzeltilmesini veya silinmesini isteme</li>
                <li>Verilerinizin üçüncü kişilere aktarılıp aktarılmadığını öğrenme</li>
                <li>Veri işlemeye itiraz etme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Veri Saklama Süresi</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı silmeniz halinde verileriniz 30 gün içinde sistemlerimizden kaldırılır. Yasal yükümlülükler kapsamında bazı veriler daha uzun süre saklanabilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. İletişim</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:<br />
                E-posta: destek@hasatlink.com
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                At HasatLink ("we", "platform"), we value the privacy of our users. This Privacy Policy explains how your personal data is collected, used, stored, and protected when you use the HasatLink platform. By using our platform, you accept this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">Our platform collects the following personal data:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li><strong>Identity Information:</strong> Name, email address, phone number</li>
                <li><strong>Location Information:</strong> City and district level location (for listing creation and map features)</li>
                <li><strong>Profile Information:</strong> Profile photo, biography, language preference</li>
                <li><strong>Listing Data:</strong> Content, photos, and pricing of your listings</li>
                <li><strong>Communication Data:</strong> Messages sent through the platform</li>
                <li><strong>Usage Data:</strong> View counts, click statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">The data we collect is used for:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Account creation and authentication</li>
                <li>Listing publication and management</li>
                <li>Facilitating communication between users</li>
                <li>Providing market prices and data</li>
                <li>AI plant diagnosis service</li>
                <li>Sending weather alerts</li>
                <li>Platform security and fraud prevention</li>
                <li>Service quality improvement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Your personal data is protected with industry-standard security measures. Passwords are hashed using bcrypt algorithm. All data transfers are encrypted with SSL/TLS. JWT-based authentication is used to prevent unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">Our platform uses the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li><strong>Google Firebase:</strong> Authentication (Google Sign-In)</li>
                <li><strong>OpenWeatherMap:</strong> Weather data</li>
                <li><strong>Izmir Metropolitan Municipality API:</strong> Market hall prices</li>
                <li><strong>MongoDB Atlas:</strong> Data storage</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookies</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Our platform uses JWT tokens for session management, stored in your browser's local storage. No third-party tracking cookies are used.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
              <p className="text-sm leading-relaxed text-[#3D3530] mb-2">You have the following rights regarding your data:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Know whether your personal data is being processed</li>
                <li>Request information about your processed data</li>
                <li>Request correction or deletion of your data</li>
                <li>Know whether your data has been shared with third parties</li>
                <li>Object to data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Your personal data is stored as long as your account is active. If you delete your account, your data will be removed from our systems within 30 days. Some data may be retained longer due to legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                For questions about our privacy policy, you can contact us at:<br />
                Email: support@hasatlink.com
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
