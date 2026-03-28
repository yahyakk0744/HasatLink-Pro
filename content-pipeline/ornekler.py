"""
HasatLink Content Pipeline — Tüm formatlar ve kategoriler için örnek post üretici.
python ornekler.py
"""
import json

ORNEKLER = {
    # ============================================================
    # 15 EVERGREEN FORMAT
    # ============================================================
    "FORMATLAR": {
        "POV": {
            "baslik": "POV: Tarlandan Direkt Alici Buluyorsun",
            "sahne_metni": (
                "Sabah 5, Antalya. Seranda domates kizarmis, hasat zamani. "
                "Eskiden ne yapiyordun? Araciya veriyordun, o da komisyonunu alip satiyordu. "
                "Simdi? Telefonunu aciyorsun, HasatLink'te 3 fotoograf cekiyorsun, "
                "fiyatini yaziyorsun, ilan veer butonu. Bitti. "
                "Aksama kadar 4 market sahibi sana mesaj atti. "
                "Fiyati sen belirliyorsun, aradaki araci yok. "
                "HasatLink'te ucretsiz ilan ver, alici seni bulsun. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "Sabah 5, sera, hasat zamani",
                "Eskiden: araciya ver, komisyon ode",
                "Simdi: HasatLink'te 3 foto cek",
                "Fiyatini yaz, ilan ver butonu",
                "4 market sahibi mesaj atti!",
                "Araciyi kaldir, direkt bulus",
                "hasatlink.com - ucretsiz ilan ver"
            ],
            "aciklama": (
                "Araciya komisyon verme devri bitti! "
                "HasatLink'te uretici ile alici direkt bulusuyor. "
                "Ucretsiz ilan ver, alicin seni bulsun.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #hasatlinkcom #Ciftci #Tarim #AracisizTicaret #Sera #Domates #POV"
            ),
            "gorsel_prompt": "POV first person view inside a greenhouse, ripe red tomatoes on vine, Turkish farmer hands holding phone, morning golden light, vertical 9:16",
        },

        "Bunu Biliyor muydun?": {
            "baslik": "Ciftcinin Urunune Aracilar %40 Komisyon Aliyor!",
            "sahne_metni": (
                "Bunu biliyor muydun? Bir domates tarladan markete gidene kadar "
                "en az 3 aracidan geciyor. Her biri komisyonunu aliyor. "
                "Ciftci 5 liraya satiyor, markette 25 lira. "
                "Aradaki 20 lira kimin cebine giriyor? Aracilarin. "
                "HasatLink ne yapiyor biliyor musun? "
                "Uretici ilanini veriyor, market sahibi direkt ureticiye ulasiyor. "
                "Araci yok, komisyon yok, simsar yok. "
                "hasatlink.com'da ucretsiz ilan ver, alici seni bulsun."
            ),
            "altyazi_satirlari": [
                "Domates tarladan markete 3 aracidan geciyor",
                "Ciftci 5 TL'ye satiyor",
                "Markette 25 TL!",
                "20 TL araciların cebinde",
                "HasatLink'te araci YOK",
                "Uretici ile alici direkt bulusuyor",
                "hasatlink.com - komisyonsuz bulus"
            ],
            "aciklama": (
                "Aradaki aracilar yuzunden ciftci az kazaniyor, tuketici cok oduyor. "
                "HasatLink'te uretici ile alici direkt bulusuyor, komisyonsuz.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #BunuBiliyorMusun #Tarim #Ciftci #AraciKaldirildi #KomisyonYok"
            ),
            "gorsel_prompt": "Infographic style showing supply chain from farm to market, middlemen icons crossed out, Turkish agricultural products, clean modern design, vertical 9:16",
        },

        "3 Hata": {
            "baslik": "Urun Satarken Yapilan 3 Buyuk Hata",
            "sahne_metni": (
                "Urun satarken yapilan 3 buyuk hata! "
                "Bir: Sadece yerel pazara bagimli kalmak. Alicin sadece koydeki tuccar mi olmali? "
                "Iki: Fiyat bilgisi olmadan satmak. Hal fiyatlarini bilmeden nasil pazarlik yapacaksin? "
                "Uc: Araciya mecbur kalmak. Alternatifin oldugunu bilmiyor musun? "
                "HasatLink'te ilan ver, Turkiye'nin her yerinden alici seni bulsun. "
                "Canli hal fiyatlarini takip et, dogru fiyattan ilan ver. "
                "Araciyi kaldir, aliciyla direkt bulus. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "HATA 1: Sadece yerel pazara bagimli",
                "HATA 2: Fiyat bilmeden satmak",
                "HATA 3: Araciya mecbur kalmak",
                "HasatLink'te Turkiye geneli alici bul",
                "Canli hal fiyatlarini takip et",
                "Araciyi kaldir, direkt bulus",
                "hasatlink.com - ucretsiz ilan ver"
            ],
            "aciklama": (
                "Urununu satarken bu 3 hatayi yapiyor musun? "
                "HasatLink ile araciyi kaldir, aliciyla direkt bulus.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #3Hata #CiftciRehberi #Tarim #UrunSatis #KomisyonYok"
            ),
            "gorsel_prompt": "Three red X marks on dark background with Turkish farmer looking frustrated, then green checkmark with phone showing HasatLink, vertical 9:16",
        },

        "Before/After": {
            "baslik": "Araciyla Satis vs HasatLink ile Direkt Bulusma",
            "sahne_metni": (
                "Once: Hasadini topluyorsun, araciyi ariyorsun, o fiyati belirliyor, "
                "komisyonunu kesiyor, kalan sana kaliyor. Soz hakki yok. "
                "Sonra: HasatLink'i aciyorsun, urunun fotografini cekiyorsun, "
                "kendi fiyatini yaziyorsun, ilan veriyorsun. "
                "Market sahibi, manav, tuccar sana direkt mesaj atiyor. "
                "Fiyati sen belirliyorsun. Komisyon yok. Araci yok. "
                "HasatLink'te uretici ile alici direkt bulusuyor. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "ONCE: Araciyi ara, o fiyat belirlesin",
                "Komisyonunu kessin, kalan sana",
                "SONRA: HasatLink'te foto cek, fiyat yaz",
                "Ilan ver, alici sana mesaj atsin",
                "Fiyati SEN belirliyorsun",
                "Araci yok, komisyon yok",
                "hasatlink.com"
            ],
            "aciklama": (
                "Araciyla satis mi, HasatLink'te direkt bulusma mi? "
                "Fiyati sen belirle, alicin seni bulsun.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #OnceVsSonra #Ciftci #AracisizTicaret #DirekttBulus"
            ),
            "gorsel_prompt": "Split screen before and after, left side dark sad farmer giving money to middleman, right side bright happy farmer using phone app, vertical 9:16",
        },

        "1 Dakikada": {
            "baslik": "1 Dakikada HasatLink'te Ilan Vermeyi Ogren",
            "sahne_metni": (
                "1 dakikada HasatLink'te nasil ilan verilir? "
                "Adim 1: hasatlink.com'a gir, ucretsiz hesap olustur. "
                "Adim 2: Urunun fotografini cek. Domates mi, biber mi, bugday mi ne varsa. "
                "Adim 3: Fiyatini yaz, miktarini belirt, konumunu sec. "
                "Ilan ver butonuna bas. Bitti! "
                "Simdi Turkiye'nin her yerinden market, manav, tuccar senin ilanini goruyor. "
                "Sana direkt mesaj atip pazarlik yapiyor. "
                "Araci yok, komisyon yok. HasatLink'te ucretsiz ilan ver. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "ADIM 1: hasatlink.com - ucretsiz hesap",
                "ADIM 2: Urunun fotografini cek",
                "ADIM 3: Fiyat, miktar, konum yaz",
                "ILAN VER butonuna bas. Bitti!",
                "Market, manav, tuccar seni goruyor",
                "Direkt mesaj, direkt pazarlik",
                "hasatlink.com - araciyi kaldir"
            ],
            "aciklama": (
                "HasatLink'te ilan vermek 3 adim, 1 dakika, tamamen ucretsiz. "
                "Alicin seni bulsun!\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #1Dakikada #IlanVer #Ciftci #NasilYapilir #Tutorial"
            ),
            "gorsel_prompt": "Step by step phone tutorial mockup, hands holding smartphone, farm products on table, clean bright background, numbers 1-2-3, vertical 9:16",
        },

        "Siralama": {
            "baslik": "Turkiye'nin En Cok Domates Ureten 5 Ili",
            "sahne_metni": (
                "Turkiye'nin en cok domates ureten 5 ili! "
                "5 numara: Mersin. Kis seralarinda domates yetistiren sehir. "
                "4 numara: Bursa. Salcalik domatesin baskenti. "
                "3 numara: Manisa. Ege'nin domates ussu. "
                "2 numara: Ankara. Polatlinin meshur domatesleri. "
                "1 numara: Antalya! Turkiye domatesinin yuzde 25'i buradan. "
                "Bu 5 ilin uretimlerinin hepsini HasatLink'te bulabilirsin. "
                "Ilan ver ya da tedarikci bul. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "5. MERSIN - Kis serasi domatesi",
                "4. BURSA - Salcalik baskenti",
                "3. MANISA - Ege'nin domates ussu",
                "2. ANKARA - Polatli domatesleri",
                "1. ANTALYA - Turkiye'nin %25'i!",
                "Hepsini HasatLink'te bul",
                "hasatlink.com - ilan ver ya da tedarikci bul"
            ],
            "aciklama": (
                "Turkiye'nin domates devleri! Sen hangi ildeki ureticiden tedarik ediyorsun? "
                "HasatLink'te tum ureticiler tek yerde.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Top5 #Domates #Tarim #TurkiyeTarimi #Antalya #Siralama"
            ),
            "gorsel_prompt": "Top 5 ranking infographic with tomato icons, Turkish map highlighting 5 cities, red and green colors, clean modern design, vertical 9:16",
        },

        "Basari Hikayesi": {
            "baslik": "Mehmet Amca HasatLink'te Aracisiz Alici Buldu",
            "sahne_metni": (
                "Aydin'da 30 donum zeytinligi olan Mehmet amcayi dinleyin. "
                "20 yildir hep aynisi: Hasat yap, araciyi ara, o ne derse o fiyat. "
                "Gecen sene oglu dedi ki baba HasatLink diye bir yer var, ilan verelim. "
                "Verdiler. Fotograflari cektiler, fiyatlarini yazdılar. "
                "1 haftada 6 tane zeytinyagi alicisi mesaj atti. "
                "Mehmet amca fiyatini kendisi belirledi, komisyon odemedi. "
                "Su an 3 restoranin sabit tedarikçisi. "
                "Sen de HasatLink'te ilan ver, alicin seni bulsun. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "Mehmet Amca, Aydin, 30 donum zeytin",
                "20 yildir: araciyi ara, o ne derse o",
                "Oglu dedi: HasatLink'te ilan verelim",
                "Foto cek, fiyat yaz, ilan ver",
                "1 haftada 6 alici mesaj atti!",
                "Fiyati kendisi belirledi, komisyon yok",
                "hasatlink.com - sen de ilan ver"
            ],
            "aciklama": (
                "Mehmet amca 20 yildir araciya mecburdu. HasatLink ile direkt alici buldu, "
                "fiyatini kendisi belirliyor. Sen de ilan ver!\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #BasariHikayesi #Ciftci #Zeytin #Aydin #GercekHikaye"
            ),
            "gorsel_prompt": "Elderly Turkish farmer smiling in olive grove, holding phone, warm sunset light, authentic rural Turkey, storytelling mood, vertical 9:16",
        },

        "Challenge": {
            "baslik": "HasatLink Challenge: Ilk Ilanini Ver!",
            "sahne_metni": (
                "HasatLink Challenge! Sana meydan okuyorum. "
                "Evinde, bahcende, tarlande ne uretiyorsan "
                "simdii HasatLink'e gir ve ilk ilanini ver. "
                "Domates mi? Ceviz mi? Bal mi? Zeytinyagi mi? "
                "Fark etmez. 3 foto cek, fiyatini yaz, ilan ver. "
                "1 dakika suruyor, tamamen ucretsiz. "
                "Sonra beni etiketle, ilk ilanini paylas. "
                "Alicin seni bulsun, araciyi kaldir. "
                "hasatlink.com simdi ilan ver!"
            ),
            "altyazi_satirlari": [
                "CHALLENGE: Ilk ilanini ver!",
                "Ne uretiyorsan: domates, bal, ceviz...",
                "3 foto cek, fiyat yaz, ilan ver",
                "1 dakika, tamamen ucretsiz",
                "Beni etiketle, ilanini paylas!",
                "Alicin seni bulsun",
                "hasatlink.com - simdi dene!"
            ],
            "aciklama": (
                "HasatLink Challenge basliyor! Ilk ilanini ver, beni etiketle. "
                "En iyi ilani paylasacagim!\n\n"
                "hasatlink.com\n\n"
                "#HasatLinkChallenge #IlanVer #Ciftci #Tarim #Challenge #SenDeDene"
            ),
            "gorsel_prompt": "Energetic challenge graphic, Turkish farmer taking selfie with products, bold text overlays, bright colors, social media style, vertical 9:16",
        },

        "Ciftcinin Gunu": {
            "baslik": "Bir Sera Ciftcisinin Gunu: Sabah Tarla, Aksam Ilan",
            "sahne_metni": (
                "Bir sera ciftcisinin gunu nasil geciyor? "
                "Sabah 5: Seraya gir, sicaklik kontrol, sulama ayarla. "
                "Sabah 7: Hasat basla, kasalari doldur. "
                "Ogle: Mola ver, HasatLink'i ac, canli hal fiyatlarini kontrol et. "
                "Ogleden sonra: Yeni hasat ettigin urunlerin fotografini cek, "
                "HasatLink'te ilan ver. Fiyatini yaz, miktarini belirt. "
                "Aksam: 3 market sahibinden mesaj gelmis. Pazarlik yap, anlas. "
                "Araci aramaya gerek yok. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "05:00 - Sera, sicaklik, sulama",
                "07:00 - Hasat basla, kasalari doldur",
                "12:00 - HasatLink'te fiyatlari kontrol et",
                "14:00 - Foto cek, ilan ver",
                "18:00 - 3 marketten mesaj gelmis!",
                "Pazarlik yap, anlas, araci yok",
                "hasatlink.com"
            ],
            "aciklama": (
                "Sabah tarlada, oglen HasatLink'te ilan, aksam aliciyla anlasmis. "
                "Dijital ciftcinin gunu boyle geciyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #DayInTheLife #Ciftci #Sera #DijitalTarim #GununRutini"
            ),
            "gorsel_prompt": "Day timeline montage, Turkish greenhouse farmer at different times of day, sunrise to sunset, warm natural colors, cinematic, vertical 9:16",
        },

        "Beklenti vs Gercek": {
            "baslik": "Beklenti vs Gercek: Araci ile Satis",
            "sahne_metni": (
                "Beklenti: Araciyi ariyorsun, iyi fiyat veriyor, "
                "urununu aliyor, paran zamaninda geliyor. "
                "Gercek: Araci gelip fiyati kendisi belirliyor, "
                "komisyonunu kesiyor, paranin yarisini odemiyor. "
                "HasatLink gercegi: Ilan ver, alici sana gelsin. "
                "Fiyati sen yaz. Pazarlik yap. Anlasinca teslim et. "
                "Araci yok, komisyon yok, surpriz kesinti yok. "
                "Uretici ile alici direkt bulusuyor. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "BEKLENTI: Araci iyi fiyat verir",
                "Param zamaninda gelir",
                "GERCEK: Araci fiyati kendisi belirler",
                "Komisyon keser, yarisini odemez",
                "HASATLINK: Ilan ver, alici sana gelsin",
                "Fiyati SEN belirle, komisyon YOK",
                "hasatlink.com"
            ],
            "aciklama": (
                "Aracidan beklentin vs gercek cok farkli degil mi? "
                "HasatLink'te uretici-alici direkt bulusuyor, komisyonsuz.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #BeklentiVsGercek #Ciftci #AraciGercegi #KomisyonYok"
            ),
            "gorsel_prompt": "Split comparison meme format, left side sparkly expectation, right side harsh reality, Turkish farmer context, funny but relatable, vertical 9:16",
        },

        "Tepki": {
            "baslik": "Aracinin Komisyonuna Tepkim",
            "sahne_metni": (
                "Bak simdi sana bir sey gosterecegim. "
                "Ciftci tarlada domates topluyor, kasaya 5 lira diyor. "
                "Araci geliyor, 1 lira komisyon. Nakliyeci, 1 lira. "
                "Hal komisyoncusu, 2 lira. Manav, 3 lira kar. "
                "Sana 12 liraya geliyor. Ciftciye 5 lira kaliyor. "
                "Aradaki 7 lira aracilar. "
                "HasatLink'te ne oluyor? Ciftci ilan veriyor, manav goruyoor, "
                "direkt mesaj atiyor, anlasiyorlar. "
                "Araci yok. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "Ciftci: 5 TL",
                "Araci komisyonu: +1 TL",
                "Nakliyeci: +1 TL",
                "Hal komisyoncusu: +2 TL",
                "Manav kari: +3 TL = 12 TL!",
                "HasatLink: Ciftci + Manav DIREKT",
                "hasatlink.com - araciyi kaldir"
            ],
            "aciklama": (
                "5 TL'lik domates neden 12 TL? Aradaki aracilar yuzunden. "
                "HasatLink'te uretici ile alici direkt bulusuyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Tepki #FiyatGercegi #Ciftci #AraciKomisyonu #KomisyonYok"
            ),
            "gorsel_prompt": "Price breakdown infographic, showing money going to different middlemen, red arrows for commission, green for direct, Turkish lira symbols, vertical 9:16",
        },

        "Hack": {
            "baslik": "Ciftci Hack: Bos Nakliye Kapasitesini Degerlendir",
            "sahne_metni": (
                "Ciftci hack'i! Nakliye masrafini nasil dusurursun biliyor musun? "
                "HasatLink'te nakliye eslestirme var. "
                "Diyelim Antalya'dan Istanbul'a bir kamyon bos donuyor. "
                "Sen de Antalya'da urun gondermek istiyorsun. "
                "HasatLink eslestirme yapiyoor, bos kapasite + senin yukun. "
                "Sofor bos donmek yerine senin yukunu aliyor, "
                "sen de tam kamyon tutmak yerine bos kapasiteyi degerlendiriyorsun. "
                "Iki taraf da kazaniyor. hasatlink.com'da nakliye ilani ver."
            ),
            "altyazi_satirlari": [
                "HACK: Nakliye masrafini dusur!",
                "HasatLink nakliye eslestirme",
                "Kamyon bos donuyor? Yukunu al!",
                "Bos kapasite + senin yukun = ESLESME",
                "Sofor bos donmuyor, sen tam kamyon tutmuyorsun",
                "Iki taraf da kazaniyor",
                "hasatlink.com - nakliye ilani ver"
            ],
            "aciklama": (
                "Nakliye masrafi cok mu? HasatLink nakliye eslestirme ile "
                "bos kapasiteyi degerlendir, iki taraf da kazansin.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #CiftciHack #Nakliye #Lojistik #BosKapasite #TarimHack"
            ),
            "gorsel_prompt": "Turkish truck on highway with cargo, logistics matching concept, arrows connecting farmer and truck driver, efficient transport visual, vertical 9:16",
        },

        "Tarladan Sofraya": {
            "baslik": "Tarladan Sofraya Araciyi Kaldir",
            "sahne_metni": (
                "Tarladan sofraya bir urrun nasil gidiyor biliyor musun? "
                "Normalde: Ciftci, araci, hal, toptanci, dagitici, market, sofra. "
                "6 durak, her durakta komisyon. "
                "HasatLink ile: Ciftci ilan veriyor, market sahibi goruyoor, "
                "mesaj atiyor, anlasiyorlar, nakliye eslestirme ile gonderim. "
                "2 durak. Ciftci daha fazla kazaniyor, "
                "market sahibi daha uygun tedaarik ediyor. "
                "Araciyi kaldir, HasatLink'te direkt bulus. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "NORMAL: Ciftci > Araci > Hal > Toptanci",
                "> Dagitici > Market > Sofra (6 durak!)",
                "Her durakta komisyon",
                "HASATLINK: Ciftci > Market (2 durak!)",
                "Ilan ver, direkt bulus",
                "Nakliye eslestirme ile gonderim",
                "hasatlink.com - araciyi kaldir"
            ],
            "aciklama": (
                "6 durak yerine 2 durak. Araciyi kaldir, HasatLink'te "
                "uretici ile alici direkt bulusuyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #TarladanSofraya #TedarikZinciri #AraciYok #KomisyonYok"
            ),
            "gorsel_prompt": "Supply chain diagram, many steps crossed out, simplified to farmer directly to store, green checkmark, Turkish farmland background, vertical 9:16",
        },

        "Araci vs Direkt": {
            "baslik": "Araciyla mi Direkt mi? Rakamlarla Gercek",
            "sahne_metni": (
                "Araciyla mi calisacaksin, direkt mi bulacaksin? "
                "Araciyla: Fiyati o belirler. Yuzde 20-40 komisyon keser. "
                "Odemeyi geciktirir. Alternatifin yok. "
                "HasatLink'te direkt bulusma: Fiyati sen belirlersin. "
                "Komisyon yok. Alici ile direkt konusursun. "
                "Teklif sistemiyle pazarlik yaparsin. "
                "Turkiye'nin her yerinden alici seni goruyor. "
                "HasatLink'te ucretsiz ilan ver, araciyi kaldir. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "ARACI: Fiyati o belirler",
                "%20-40 komisyon keser",
                "Odemeyi geciktirir",
                "HASATLINK: Fiyati SEN belirle",
                "Komisyon YOK",
                "Aliciyla direkt konus, pazarlik yap",
                "hasatlink.com - ucretsiz ilan ver"
            ],
            "aciklama": (
                "Araciyla calismanin ve HasatLink'te direkt bulusmanin farki ortada. "
                "Komisyonsuz, seffaf, direkt.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #AraciVsDirekt #Ciftci #KomisyonKarsilastirma #DirektBulus"
            ),
            "gorsel_prompt": "Comparison table graphic, left column red (middleman fees), right column green (HasatLink direct), Turkish agricultural context, clean design, vertical 9:16",
        },

        "Nasil Yapilir": {
            "baslik": "HasatLink'te Tedarikci Bulmak 3 Adim",
            "sahne_metni": (
                "Market sahibi misin? Manav misin? Restoran isletiyor musun? "
                "Tedarikciyi nasil bulacaksin? 3 adim. "
                "Bir: hasatlink.com'a gir, ucretsiz kayit ol. "
                "Iki: Istedigin urunu ara. Domates, biber, zeytin, bal, ne istiyorsan. "
                "Konuma gore, fiyata gore, miktara gore filtrele. "
                "Uc: Begendigin ilana mesaj at, ureticiye direkt ulas. "
                "Fiyati konusun, miktari belirleyin, anlasin. "
                "Araci yok, komisyon yok. hasatlink.com"
            ),
            "altyazi_satirlari": [
                "Market, manav, restoran sahibi misin?",
                "ADIM 1: hasatlink.com - ucretsiz kayit",
                "ADIM 2: Urunu ara, filtrele",
                "ADIM 3: Ureticiye direkt mesaj at",
                "Fiyati konusun, anlasin",
                "Araci yok, komisyon yok",
                "hasatlink.com"
            ],
            "aciklama": (
                "Tedarikci bulmak artik cok kolay. HasatLink'te ureticiye "
                "direkt ulas, araciyi kaldir.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #NasilYapilir #Tedarik #Market #Manav #Tutorial"
            ),
            "gorsel_prompt": "Turkish grocery store owner using phone to find suppliers, fresh vegetables in background, step by step arrows, bright clean look, vertical 9:16",
        },
    },

    # ============================================================
    # TREND + TARIM BIRLESTIRME ORNEKLERI
    # ============================================================
    "TREND_BIRLESTIRME": {
        "Enflasyon Trendi": {
            "baslik": "Enflasyonda Araciyi Kes, Direkt Bulus!",
            "trend": "#enflasyon (Google Trends'te yukseliste)",
            "sahne_metni": (
                "Herkes enflasyondan sikayet ediyor ama sunu biliyor musun? "
                "Fiyat artisinin buyuk kismi aracılardan kaynaklaniyor. "
                "Ciftci ayni fiyata satiyor, ama aradaki 3-4 araci "
                "her biri payyini aliyor, fiyat katlaniyor. "
                "Cozum basit: Araciyi kaldir. "
                "HasatLink'te uretici ile alici direkt bulusuyor. "
                "Komisyon yok, simsar yok. "
                "Uretici ilan veriyor, market sahibi direkt ulasiyor. "
                "hasatlink.com'da sen de araciyi kaldir."
            ),
            "aciklama": (
                "Enflasyonun sebebi aracilar! HasatLink'te uretici ile alici "
                "direkt bulusuyor, komisyonsuz.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Enflasyon #AraciKaldir #Ciftci #DirektBulus #hasatlinkcom"
            ),
        },

        "Yapay Zeka Trendi": {
            "baslik": "HasatLink'te AI ile Bitki Hastaligi Teshis Et",
            "trend": "#YapayZeka (TikTok'ta trending)",
            "sahne_metni": (
                "Yapay zeka sadece ChatGPT degilil! "
                "HasatLink'te yapay zeka ciftcinin isine yariyor. "
                "Bitkinde bir sorun mu var? Yapragin sarariyor mu? "
                "Fotograf cek, HasatLink'in yapay zekasi hastaligi teshis etsin. "
                "Hangi hastalik, ne yapman gerekiyor, hepsi aninda. "
                "Ustelik tamamen ucretsiz. "
                "HasatLink sadece ilan sitesi degil, ciftcinin dijital partneri. "
                "hasatlink.com'da dene."
            ),
            "aciklama": (
                "Yapay zeka ciftcinin isine yariyor! HasatLink'te fotograf cek, "
                "bitki hastaliginii aninda ogren.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #YapayZeka #AI #BitkiHastaligi #DijitalTarim #Teknoloji"
            ),
        },

        "Pahalılık Trendi": {
            "baslik": "Neden Bu Kadar Pahali? Aracilar Yuzunden!",
            "trend": "#pahalilik (Twitter'da trending)",
            "sahne_metni": (
                "Neden her sey bu kadar pahali diye soruyor herkes. "
                "Sana gostereyyim. Ciftci domatesi 5 liraya satiyor. "
                "Araci aliyor 6, hal komisyoncusu 8, toptanci 10, "
                "market 15 liraya sana satiyor. "
                "Ciftci 5 kazandi, aradaki 10 lira aracilaarin. "
                "HasatLink ne yapiyor? "
                "Uretici ilan veriyor, alici direkt ureticiye ulasiyor. "
                "Aradaki zincir kalkiyor. "
                "hasatlink.com — uretici ile alici komisyonsuz bulusuyor."
            ),
            "aciklama": (
                "Pahalilik aracılardan! HasatLink'te uretici ile alici "
                "direkt bulusuyor, komisyon zinciri kalkiyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Pahalilik #NedenPahali #AraciZinciri #DirektBulus"
            ),
        },
    },

    # ============================================================
    # BOLGESEL TAKVIM ORNEKLERI
    # ============================================================
    "BOLGESEL": {
        "Antalya - Sera Domatesi (Ocak)": {
            "baslik": "Antalya Sera Domatesi Hasat Zamani!",
            "sahne_metni": (
                "Ocak ayi, Antalya seralari tam gaz calisiyor. "
                "Turkiye'nin kis domatesinin yuzde 70'i buradan cikiyor. "
                "Sera ciftcisi hasat yapiyor ama kime satacak? "
                "Eskisi gibi araciyi mi arayacak? "
                "HasatLink'te ilan ver, Istanbul'dan Ankara'dan "
                "market sahipleri senin ilanini gorsun, sana direkt ulassin. "
                "Fiyati sen belirle, komisyon odeme. "
                "Antalya'nin sera domatesi HasatLink'te alicisini buluyor. "
                "hasatlink.com"
            ),
            "aciklama": (
                "Antalya sera domatesi hasat zamani! Ureticiler HasatLink'te "
                "ilan veriyor, alicilar direkt bulusuyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Antalya #SeraDomatesi #Hasat #KisTarimi #IlanVer"
            ),
        },

        "Trabzon - Cay Hasadi (Mayis)": {
            "baslik": "Rize-Trabzon Cay Hasadi Basladi!",
            "sahne_metni": (
                "Mayis geldi, Karadeniz yemyesil! "
                "Ilk surgun cay hasadi basladi. En kaliteli cay bu donemde cikar. "
                "Cay ureticileri! CAYKUR'a vermek tek secenek degil. "
                "HasatLink'te ozel cay ilaninizi verin. "
                "Butik cay alicilari, organik cay arayanlar, "
                "ihracatcilar sizin ilaninizi gorsun. "
                "Direkt iletisime gecsin, fiyati konusun. "
                "HasatLink'te ucretsiz ilan ver. hasatlink.com"
            ),
            "aciklama": (
                "Karadeniz cay hasadi basladi! Ureticiler HasatLink'te "
                "ilan verip butik alicilara direkt ulasiyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Cay #Rize #Trabzon #Karadeniz #CayHasadi #IlanVer"
            ),
        },

        "Gaziantep - Antep Fistigi (Agustos)": {
            "baslik": "Antep Fistigi Hasat Zamani!",
            "sahne_metni": (
                "Agustos, Gaziantep. Fistik bahcelerinde citcit sesi duyuluyor. "
                "Citcit sesi fistiigin olgunlastiginin isaretii. "
                "Turkiye dunya antep fistigi uretiminin yuzde 30'unu karsilar. "
                "Fistik ureticileri! Hasadinizi HasatLink'te ilan verin. "
                "Kuruyemisci, pastane, ihracatci sizi bulsun. "
                "Fiyati siz belirleyin, araci komisyonu yok. "
                "HasatLink'te uretici ile alici direkt bulusuyor. hasatlink.com"
            ),
            "aciklama": (
                "Antep fistigi hasat zamani! Gaziantep'in gururu HasatLink'te "
                "ureticiden direkt aliciya.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #AntepFistigi #Gaziantep #Hasat #Kuruyemis #IlanVer"
            ),
        },

        "Malatya - Kayisi (Temmuz)": {
            "baslik": "Malatya Kayisisi Dunyaya Hasatlink'ten Aciliyor",
            "sahne_metni": (
                "Temmuz, Malatya. Dunya kayisi uretiminin yuzde 85'i buradan. "
                "Kayisi hasadi basladi! Kurutmalik mi, taze mi satacaksin? "
                "HasatLink'te ilanini ver. Taze kayisi, kurutmalik kayisi, "
                "cekirdek ici, kayisi pestili — hepsini ilanla. "
                "Istanbul'dan Almanya'dan alicilar senin ilanini gorsun. "
                "Direkt mesaj atsin, fiyati konusun. "
                "Araciyi aradan cikar, HasatLink'te direkt bulus. hasatlink.com"
            ),
            "aciklama": (
                "Dunya kayisisinin %85'i Malatya'dan! Ureticiler HasatLink'te "
                "ilan veriyor, alicilar direkt ulasiyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Malatya #Kayisi #DunyaBirincisi #IlanVer #DirektBulus"
            ),
        },

        "Konya - Bugday Hasat (Temmuz)": {
            "baslik": "Konya Bugday Hasadi: Turkiye'nin Ekmegi",
            "sahne_metni": (
                "Temmuz, Konya ovasi altin sari. Bicerdoverler tarlada. "
                "Turkiye'nin ekmeklik bugdayinin buyuk kismi buradan cikar. "
                "Bugday ureticileri! TMO'ya vermek tek secenek degil. "
                "HasatLink'te bugday ilaninizi verin. "
                "Degirmenler, un fabrikaalari, yem uretcileri sizi bulsun. "
                "Fiyati kendiniz belirleyin, dogrudan pazarlik yapin. "
                "HasatLink'te uretici ile alici komisyonsuz bulusuyor. hasatlink.com"
            ),
            "aciklama": (
                "Konya bugday hasadi zamani! Ureticiler HasatLink'te "
                "ilan veriyor, degirmen ve fabrikalar direkt bulusuyor.\n\n"
                "hasatlink.com\n\n"
                "#HasatLink #Bugday #Konya #Hasat #Tarim #EkmeklikBugday #IlanVer"
            ),
        },
    },
}


def print_ornekler():
    for kategori, items in ORNEKLER.items():
        print(f"\n{'='*70}")
        print(f"  {kategori}")
        print(f"{'='*70}")

        for isim, data in items.items():
            print(f"\n{'-'*70}")
            print(f"  {isim}")
            print(f"{'-'*70}")

            if "trend" in data:
                print(f"  TREND: {data['trend']}")

            print(f"\n  BASLIK: {data['baslik']}")
            print(f"\n  SAHNE METNI (seslendirilecek):")
            # Satira bol
            metin = data["sahne_metni"]
            words = metin.split()
            line = "    "
            for w in words:
                if len(line) + len(w) > 75:
                    print(line)
                    line = "    " + w + " "
                else:
                    line += w + " "
            if line.strip():
                print(line)

            if "altyazi_satirlari" in data:
                print(f"\n  ALTYAZI SATIRLARI (ekranda gorunecek):")
                for i, s in enumerate(data["altyazi_satirlari"], 1):
                    print(f"    [{i}] {s}")

            print(f"\n  ACIKLAMA (sosyal medya):")
            for line in data["aciklama"].split("\n"):
                if line.strip():
                    print(f"    {line.strip()}")

            if "gorsel_prompt" in data:
                print(f"\n  GORSEL PROMPT: {data['gorsel_prompt'][:80]}...")


if __name__ == "__main__":
    print_ornekler()

    # Istatistik
    total = 0
    for k, v in ORNEKLER.items():
        total += len(v)
    print(f"\n\n{'='*70}")
    print(f"  TOPLAM: {total} ornek post")
    print(f"  - {len(ORNEKLER['FORMATLAR'])} format ornegi")
    print(f"  - {len(ORNEKLER['TREND_BIRLESTIRME'])} trend birlestirme ornegi")
    print(f"  - {len(ORNEKLER['BOLGESEL'])} bolgesel takvim ornegi")
    print(f"{'='*70}")
