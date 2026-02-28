import { useTranslation } from 'react-i18next';

export default function TermsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">
        {isTr ? 'Kullanım Şartları' : 'Terms of Service'}
      </h1>
      <p className="text-sm text-[#6B6560] mb-8">
        {isTr ? 'Son güncelleme: 28 Şubat 2026' : 'Last updated: February 28, 2026'}
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-[#1A1A1A]">
        {isTr ? (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Genel Hükümler</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Bu Kullanım Şartları, HasatLink platformunun ("Platform") kullanımına ilişkin koşulları düzenler. Platformu kullanarak bu şartları kabul etmiş sayılırsınız. HasatLink, tarım sektöründe alıcı ve satıcıları buluşturan bir pazar yeri platformudur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Hesap Oluşturma</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Platform'u kullanmak için hesap oluşturmanız gerekmektedir.</li>
                <li>Kayıt sırasında doğru ve güncel bilgiler vermeniz zorunludur.</li>
                <li>Hesap güvenliğinizden siz sorumlusunuz.</li>
                <li>Her kullanıcı yalnızca bir hesap oluşturabilir.</li>
                <li>18 yaşından küçükler platformu kullanamazlar.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. İlan Kuralları</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>İlanlar yalnızca tarım ile ilgili ürün ve hizmetler için oluşturulabilir.</li>
                <li>İlan içeriği doğru, güncel ve yanıltıcı olmayan bilgiler içermelidir.</li>
                <li>Yasadışı ürün ve hizmetlerin ilanı kesinlikle yasaktır.</li>
                <li>Fiyatlar Türk Lirası (₺) cinsinden belirtilmelidir.</li>
                <li>İlan görselleri ürünü doğru şekilde yansıtmalıdır.</li>
                <li>Aynı ürün için mükerrer ilan oluşturmak yasaktır.</li>
                <li>HasatLink, uygunsuz ilanları önceden bildirim yapmaksızın kaldırma hakkını saklı tutar.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Kullanıcı Sorumlulukları</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Platformu yalnızca yasal amaçlarla kullanacağınızı taahhüt edersiniz.</li>
                <li>Diğer kullanıcılara saygılı davranmanız gerekmektedir.</li>
                <li>Spam, dolandırıcılık veya kötü niyetli faaliyetler yasaktır.</li>
                <li>Platform altyapısına zarar verecek eylemlerden kaçınmalısınız.</li>
                <li>İlanlarınızdaki bilgilerin doğruluğundan siz sorumlusunuz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Alım-Satım İşlemleri</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink, alıcı ve satıcıları buluşturan bir aracı platformdur. Taraflar arasındaki alım-satım işlemlerinden doğrudan sorumlu değildir. Ödeme, teslimat ve ürün kalitesi ile ilgili anlaşmazlıklar taraflar arasında çözümlenmelidir. HasatLink, herhangi bir ürün veya hizmetin kalitesini garanti etmez.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Fikri Mülkiyet</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink platformunun tasarımı, logosu, yazılımı ve içeriği HasatLink'e aittir ve telif hakkı ile korunmaktadır. Kullanıcılar, yükledikleri içeriklerin fikri mülkiyet haklarına sahip olmaya devam eder ancak bu içeriklerin platformda görüntülenmesi için HasatLink'e lisans vermiş sayılır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. AI Teşhis Hizmeti</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink'in AI bitki teşhis özelliği yalnızca bilgi amaçlıdır ve profesyonel tarım danışmanlığı yerine geçmez. Teşhis sonuçları kesin tanı niteliği taşımaz. Önemli tarımsal kararlar için uzman görüşü almanız tavsiye edilir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Hal Fiyatları ve Pazar Verileri</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Platformda gösterilen hal fiyatları İzmir Büyükşehir Belediyesi açık veri kaynaklarından alınmaktadır. HasatLink Pazarı fiyatları kullanıcı ilanlarına dayalı olarak hesaplanır. Bu veriler bilgi amaçlı olup, yatırım veya ticari karar için tek başına referans alınmamalıdır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Hizmet Değişiklikleri</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink, platformun özelliklerini, işlevlerini ve bu Kullanım Şartlarını önceden bildirim yaparak değiştirme hakkını saklı tutar. Değişikliklerden sonra platformu kullanmaya devam etmeniz, güncellenmiş şartları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Hesap Askıya Alma ve Kapatma</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink, bu kullanım şartlarını ihlal eden hesapları geçici veya kalıcı olarak askıya alma ya da kapatma hakkını saklı tutar. Hesap kapatma durumunda kullanıcıya bildirim yapılır.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Sorumluluk Sınırları</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink, platformun kesintisiz veya hatasız çalışacağını garanti etmez. Kullanıcılar arası işlemlerden, veri kaybından veya platformun kullanımından doğabilecek doğrudan veya dolaylı zararlardan HasatLink sorumlu tutulamaz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Uygulanacak Hukuk</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Bu Kullanım Şartları, Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda Adana Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. İletişim</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Kullanım şartları hakkında sorularınız için bizimle iletişime geçebilirsiniz:<br />
                E-posta: destek@hasatlink.com
              </p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-semibold mb-3">1. General Provisions</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                These Terms of Service govern the use of the HasatLink platform ("Platform"). By using the Platform, you accept these terms. HasatLink is a marketplace platform connecting buyers and sellers in the agricultural sector.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Account Registration</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>You must create an account to use the Platform.</li>
                <li>You must provide accurate and up-to-date information during registration.</li>
                <li>You are responsible for the security of your account.</li>
                <li>Each user may only create one account.</li>
                <li>Users under 18 years of age may not use the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Listing Rules</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>Listings may only be created for agriculture-related products and services.</li>
                <li>Listing content must be accurate, current, and not misleading.</li>
                <li>Listing of illegal products and services is strictly prohibited.</li>
                <li>Prices must be specified in Turkish Lira (₺).</li>
                <li>Listing images must accurately represent the product.</li>
                <li>Creating duplicate listings for the same product is prohibited.</li>
                <li>HasatLink reserves the right to remove inappropriate listings without prior notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1 text-sm text-[#3D3530]">
                <li>You agree to use the Platform only for lawful purposes.</li>
                <li>You must treat other users with respect.</li>
                <li>Spam, fraud, or malicious activities are prohibited.</li>
                <li>You must refrain from actions that could damage the platform infrastructure.</li>
                <li>You are responsible for the accuracy of information in your listings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Transactions</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink is an intermediary platform connecting buyers and sellers. It is not directly responsible for transactions between parties. Disputes regarding payment, delivery, and product quality must be resolved between the parties. HasatLink does not guarantee the quality of any product or service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                The design, logo, software, and content of the HasatLink platform belong to HasatLink and are protected by copyright. Users retain intellectual property rights to their uploaded content but grant HasatLink a license to display such content on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. AI Diagnosis Service</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink's AI plant diagnosis feature is for informational purposes only and does not replace professional agricultural advice. Diagnosis results are not definitive. We recommend consulting experts for important agricultural decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Market Prices and Data</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                Market hall prices shown on the platform are sourced from Izmir Metropolitan Municipality open data. HasatLink Market prices are calculated based on user listings. This data is for informational purposes and should not be used as the sole reference for investment or commercial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Service Changes</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink reserves the right to modify the platform's features, functionality, and these Terms of Service with prior notice. Continuing to use the platform after changes means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Account Suspension and Closure</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink reserves the right to temporarily or permanently suspend or close accounts that violate these terms of service. Users will be notified in case of account closure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                HasatLink does not guarantee that the platform will operate without interruption or error. HasatLink cannot be held liable for direct or indirect damages arising from transactions between users, data loss, or use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Governing Law</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                These Terms of Service are subject to the laws of the Republic of Turkey. Adana Courts and Execution Offices have jurisdiction in disputes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
              <p className="text-sm leading-relaxed text-[#3D3530]">
                For questions about the terms of service, you can contact us at:<br />
                Email: support@hasatlink.com
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
