import SEO from '../components/ui/SEO';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in">
      <SEO
        title="Kullanım Şartları"
        description="HasatLink kullanım şartları, koşulları ve sorumluluk sınırları."
      />
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Kullanım Şartları</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">Son güncelleme: 28 Şubat 2026</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[var(--text-primary)]">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Genel Hükümler</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Bu Kullanım Şartları, HasatLink platformunun ("Platform") kullanımına ilişkin koşulları düzenler. Platformu kullanarak bu şartları kabul etmiş sayılırsınız.
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 text-sm">
            <p className="font-semibold text-[#2D6A4F] mb-1">Önemli Bilgilendirme</p>
            <p className="text-[var(--text-primary)]">
              HasatLink <strong>yalnızca bir ilan platformudur</strong>. Tarım sektöründe alıcı ve satıcıları buluşturmak amacıyla hizmet vermektedir. Platform üzerinden gerçekleşen hiçbir alım-satım işleminde HasatLink taraf değildir.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Platformun Niteliği ve Sorumluluk Sınırları</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            HasatLink'in hukuki konumu ve sorumluluk sınırları aşağıdaki şekildedir:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-primary)]">
            <li><strong>HasatLink sadece bir ilan platformudur.</strong> Kullanıcıların ilan yayınlaması için teknik altyapı sağlar; alım-satım işlemlerinin tarafı değildir.</li>
            <li><strong>Alım-satım işlemlerinden HasatLink sorumlu değildir.</strong> Platform üzerinden başlayan her türlü ticari ilişki, ödeme, teslimat ve anlaşmazlık tamamen alıcı ve satıcı arasındadır.</li>
            <li><strong>Ödeme ve teslimat taraflar arasında gerçekleşir.</strong> HasatLink herhangi bir ödeme aracılık hizmeti sunmaz. Para transferi, nakliye, kargo ve teslim süreçleri kullanıcıların kendi sorumluluğundadır.</li>
            <li><strong>Ürün ve hizmet kalitesi garanti edilmez.</strong> İlanlarda yer alan ürünlerin kalitesi, miktarı, durumu veya açıklamayla uyumu konusunda HasatLink herhangi bir garanti vermez.</li>
            <li><strong>Fiyat bilgileri bağlayıcı değildir.</strong> İlanlardaki fiyatlar satıcılar tarafından belirlenir ve HasatLink tarafından doğrulanmaz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Hesap Oluşturma ve Güvenlik</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Platform'u kullanmak için hesap oluşturmanız gerekmektedir</li>
            <li>Kayıt sırasında doğru ve güncel bilgiler vermeniz zorunludur</li>
            <li>Hesap güvenliğinizden ve şifrenizin gizliliğinden siz sorumlusunuz</li>
            <li>Her kullanıcı yalnızca bir hesap oluşturabilir</li>
            <li>18 yaşından küçükler platformu kullanamazlar</li>
            <li>Hesabınızın yetkisiz kullanıldığını fark etmeniz halinde derhal bize bildirmeniz gerekmektedir</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. İlan Kuralları</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>İlanlar yalnızca tarım ile ilgili ürün ve hizmetler için oluşturulabilir</li>
            <li>İlan içeriği doğru, güncel ve yanıltıcı olmayan bilgiler içermelidir</li>
            <li><strong>Yasadışı ürün ve hizmetlerin ilanı kesinlikle yasaktır</strong> ve bu tür ilanlar önceden bildirim yapılmaksızın kaldırılır</li>
            <li>Fiyatlar Türk Lirası (₺) cinsinden belirtilmelidir</li>
            <li>İlan görselleri ürünü doğru şekilde yansıtmalıdır</li>
            <li>Aynı ürün için mükerrer ilan oluşturmak yasaktır</li>
            <li>Sahte, yanıltıcı veya gerçek dışı ilanlar yasaktır</li>
            <li>HasatLink, kurallara uymayan ilanları önceden bildirim yapmaksızın kaldırma hakkını saklı tutar</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Kullanıcı Sorumlulukları</h2>
          <div className="p-4 rounded-xl bg-[#C1341B]/5 border border-[#C1341B]/20 text-sm mb-4">
            <p className="font-semibold text-[#C1341B] mb-1">Önemli</p>
            <p className="text-[var(--text-primary)]">
              Kullanıcılar, yayınladıkları ilanların içeriğinden, doğruluğundan ve yasal uygunluğundan <strong>bizzat kendileri sorumludur</strong>. HasatLink, kullanıcıların ilan içeriklerinden kaynaklanan hukuki sorunlardan sorumlu tutulamaz.
            </p>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Platformu yalnızca yasal amaçlarla kullanacağınızı taahhüt edersiniz</li>
            <li>Diğer kullanıcılara saygılı davranmanız gerekmektedir</li>
            <li>Spam, dolandırıcılık veya kötü niyetli faaliyetler yasaktır</li>
            <li>Platform altyapısına zarar verecek eylemlerden kaçınmalısınız</li>
            <li>Başkalarının kişisel bilgilerini izinsiz paylaşmak yasaktır</li>
            <li>Platformu otomatik araçlar (bot, scraper vb.) ile kullanmak yasaktır</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Yasadışı İçerik Politikası</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-2">
            Aşağıdaki içerikleri barındıran ilanlar derhal kaldırılır ve ilgili hesaplar askıya alınır:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>Yasadışı ürün veya hizmetler</li>
            <li>Fikri mülkiyet haklarını ihlal eden içerikler</li>
            <li>Sahte veya çalıntı ürünler</li>
            <li>Zararlı kimyasal madde veya yasaklı tarım ilaçları</li>
            <li>Dolandırıcılık amaçlı ilanlar</li>
            <li>Nefret söylemi, ayrımcılık veya tehdit içeren içerikler</li>
          </ul>
          <p className="text-sm leading-relaxed text-[var(--text-primary)] mt-2">
            HasatLink, gerekli hallerde ilgili yasal mercilere bildirimde bulunma hakkını saklı tutar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. AI Teşhis Hizmeti</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink'in yapay zeka destekli bitki teşhis özelliği <strong>yalnızca bilgilendirme amaçlıdır</strong> ve profesyonel tarım danışmanlığı yerine geçmez. Teşhis sonuçları kesin tanı niteliği taşımaz. Önemli tarımsal kararlar için mutlaka uzman görüşü almanız tavsiye edilir. AI teşhis hizmetinin kullanımından doğabilecek zararlardan HasatLink sorumlu tutulamaz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Hal Fiyatları ve Pazar Verileri</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Platformda gösterilen hal fiyatları üçüncü taraf açık veri kaynaklarından alınmaktadır. HasatLink Pazarı fiyatları kullanıcı ilanlarına dayalı olarak hesaplanır. Bu veriler <strong>bilgi amaçlıdır</strong> ve ticari kararlar için tek başına referans alınmamalıdır. Veri doğruluğu konusunda HasatLink garanti vermez.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Fikri Mülkiyet</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink platformunun tasarımı, logosu, yazılımı ve özgün içeriği HasatLink'e aittir ve telif hakkı ile korunmaktadır. Kullanıcılar, yükledikleri içeriklerin fikri mülkiyet haklarına sahip olmaya devam eder; ancak bu içeriklerin platformda görüntülenmesi ve tanıtım amacıyla kullanılması için HasatLink'e sınırlı bir lisans vermiş sayılır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Hesap Askıya Alma ve Kapatma</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink, bu kullanım şartlarını ihlal eden hesapları geçici veya kalıcı olarak askıya alma ya da kapatma hakkını saklı tutar. Hesap askıya alınması veya kapatılması durumunda kullanıcıya bildirim yapılır. Tekrarlayan ihlallerde kalıcı hesap kapatma uygulanabilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Hizmet Değişiklikleri</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            HasatLink, platformun özelliklerini, işlevlerini ve bu Kullanım Şartlarını önceden bildirim yaparak değiştirme hakkını saklı tutar. Değişikliklerden sonra platformu kullanmaya devam etmeniz, güncellenmiş şartları kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">12. Sorumluluk Reddi</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--text-primary)]">
            <li>HasatLink, platformun kesintisiz veya hatasız çalışacağını garanti etmez</li>
            <li>Kullanıcılar arası işlemlerden doğan zararlardan HasatLink sorumlu tutulamaz</li>
            <li>Veri kaybından veya platformun kullanımından doğabilecek doğrudan veya dolaylı zararlardan HasatLink sorumlu değildir</li>
            <li>Üçüncü taraf web sitelerine verilen bağlantıların içeriğinden HasatLink sorumlu değildir</li>
            <li>Mücbir sebepler (doğal afet, savaş, teknik altyapı sorunları vb.) nedeniyle hizmet kesintilerinden sorumluluk kabul edilmez</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">13. Uygulanacak Hukuk ve Yetkili Mahkeme</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Bu Kullanım Şartları, Türkiye Cumhuriyeti kanunlarına tabidir. Bu şartlardan doğabilecek uyuşmazlıklarda Adana Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">14. İletişim</h2>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            Kullanım şartları hakkında sorularınız için bizimle iletişime geçebilirsiniz:
          </p>
          <div className="mt-3 p-4 rounded-xl bg-[var(--bg-input)] text-sm space-y-1">
            <p><strong>E-posta:</strong> destek@hasatlink.com</p>
          </div>
        </section>
      </div>
    </div>
  );
}
