"""
Türkiye Bölgesel Tarım Takvimi
7 coğrafi bölge × 12 ay × ürün bazlı ekim/hasat/bakım bilgisi

Kaynak: Tarım ve Orman Bakanlığı verileri + yerel çiftçi bilgisi
"""
from datetime import datetime

# Bölge → Ay → Gündem listesi
# Her gündem: (ürün, aksiyon, ipucu)
BOLGESEL_TAKVIM = {
    "akdeniz": {
        "ad": "Akdeniz Bölgesi",
        "iller": ["Antalya", "Mersin", "Adana", "Hatay", "Isparta", "Burdur", "Osmaniye", "Kahramanmaraş"],
        "iklim": "Sıcak, uzun yaz, ılık kış, sera tarımı güçlü",
        "aylar": {
            1: [
                ("Sera domatesi", "hasat", "Kış seralarında domates hasadı devam ediyor. Fiyatlar Ocak'ta zirve yapar."),
                ("Narenciye", "hasat", "Portakal, mandalina, limon hasadı tam gaz. Depolama şartlarına dikkat."),
                ("Çilek", "dikim", "Sera çileği fidesi dikimi. Toprak sıcaklığı 10°C üstü olmalı."),
            ],
            2: [
                ("Sera domatesi", "hasat", "Antalya seraları Türkiye'nin %70 kış domatesini üretir."),
                ("Narenciye", "hasat", "Mersin-Adana hattı narenciye ihracatında zirve ayı."),
                ("Muz", "bakım", "Anamur muzu budama ve gübreleme zamanı."),
            ],
            3: [
                ("Domates", "fide", "Açık alan domates fidesi hazırlığı. Sera fidesi Mart sonu şaşırtma."),
                ("Biber", "fide", "Sivri ve dolmalık biber fidesi üretimi başlıyor."),
                ("Çilek", "hasat", "İlk sera çilekleri pazarda. Erken hasat primi var."),
            ],
            4: [
                ("Domates", "dikim", "Açık alan domates dikimi başladı. Gece donuna dikkat!"),
                ("Karpuz", "dikim", "Adana'da karpuz fidesi toprağa iniyor."),
                ("Biber", "dikim", "Sera biberleri açık alana şaşırtılıyor."),
            ],
            5: [
                ("Çilek", "hasat", "Açık alan çilek hasadı zirve. 2 günde bir topla."),
                ("Domates", "bakım", "İlk çapalama ve sulama programı. Damlama sulama şart."),
                ("Kayısı", "hasat", "Erken kayısı çeşitleri Mersin'de hasat ediliyor."),
            ],
            6: [
                ("Domates", "hasat", "İlk açık alan domates hasadı! Fiyatlar düşmeye başlar."),
                ("Karpuz", "hasat", "Adana karpuzları çıkıyor. Tarlada olgunluk kontrolü önemli."),
                ("Şeftali", "hasat", "Erken şeftali hasat zamanı."),
            ],
            7: [
                ("Domates", "hasat", "Zirve hasat ayı. Salçalık domates sezonu."),
                ("Üzüm", "hasat", "Sofralık üzüm hasadı başlıyor. Sultani Temmuz sonu."),
                ("İncir", "hasat", "Erken incir (yediveren) hasadı."),
            ],
            8: [
                ("Domates", "hasat", "Salçalık domates hasadı devam. Kurutmalık için ideal ay."),
                ("Üzüm", "hasat", "Şaraplık ve kurutmalık üzüm hasadı."),
                ("Nar", "bakım", "Nar olgunlaşıyor, sulama azaltılmalı."),
            ],
            9: [
                ("Nar", "hasat", "Antalya narı hasat zamanı. Kabuk çatlamasına dikkat."),
                ("Sera", "hazırlık", "Kış serası hazırlığı: dezenfeksiyon, toprak analizi."),
                ("Turunçgil", "bakım", "Narenciye bahçelerinde son gübreleme."),
            ],
            10: [
                ("Sera domatesi", "dikim", "Kış serası domates fidesi dikimi başlıyor."),
                ("Portakal", "hasat", "Erken portakal çeşitleri hasat ediliyor."),
                ("Muz", "hasat", "Anamur muzu hasat sezonu."),
            ],
            11: [
                ("Narenciye", "hasat", "Portakal, mandalina ana hasat ayı."),
                ("Sera", "bakım", "Sera ısıtma sistemi kontrolü. Gece sıcaklığı 15°C altına düşmemeli."),
                ("Avokado", "hasat", "Alanya avokado hasadı."),
            ],
            12: [
                ("Sera domatesi", "hasat", "Kış sera ürünleri pazara çıkıyor."),
                ("Narenciye", "hasat", "Limon ihracat sezonu. Mersin limanından sevkiyat."),
                ("Sera biber", "hasat", "Kış sera biberi hasadı."),
            ],
        }
    },

    "ege": {
        "ad": "Ege Bölgesi",
        "iller": ["İzmir", "Aydın", "Muğla", "Denizli", "Manisa", "Kütahya", "Afyon", "Uşak"],
        "iklim": "Ilıman Akdeniz, zeytincilik ve bağcılık güçlü",
        "aylar": {
            1: [
                ("Zeytin", "hasat", "Zeytinyağı sıkım sezonu devam. Soğuk sıkım kaliteli yağ verir."),
                ("Sera", "bakım", "Sera sebzeleri bakım ve hasat."),
                ("Enginar", "dikim", "Enginar fidesi dikimi İzmir çevresinde."),
            ],
            2: [
                ("Zeytin", "budama", "Hasat sonrası budama zamanı. Dalları %30 seyrelt."),
                ("Bağ", "budama", "Asma budaması. Kış budaması verim için kritik."),
                ("Enginar", "bakım", "Enginar tarlası gübreleme ve çapalama."),
            ],
            3: [
                ("Bağ", "bakım", "Asma gözleri uyanıyor. İlaçlama programı başlasın."),
                ("Domates", "fide", "Ege domatesi fide hazırlığı."),
                ("Çiçek", "dikim", "Süs bitkileri ve çiçek dikimi sezonu."),
            ],
            4: [
                ("Enginar", "hasat", "İzmir enginarı hasat zamanı! Türkiye'nin %90'ı buradan."),
                ("Kiraz", "bakım", "Kiraz ağaçları çiçek açtı. Don riski var!"),
                ("Domates", "dikim", "Açık alan domates dikimi."),
            ],
            5: [
                ("Kiraz", "hasat", "Ege kirazı pazarda. İlk kiraz primi yüksek."),
                ("Enginar", "hasat", "Enginar hasadı devam."),
                ("İncir", "bakım", "İncir ağaçları meyve tutmaya başladı."),
            ],
            6: [
                ("Kiraz", "hasat", "Son kiraz hasadı. Geç çeşitler."),
                ("Şeftali", "hasat", "Ege şeftalisi pazarda."),
                ("Kavun", "hasat", "Kırkağaç kavunu çıkmaya başladı!"),
            ],
            7: [
                ("İncir", "hasat", "Aydın inciri hasat başlıyor. Kurutmalık ayır."),
                ("Üzüm", "hasat", "Sultani üzüm hasadı. Manisa üzüm başkenti."),
                ("Kavun", "hasat", "Kırkağaç kavunu zirve sezonu."),
            ],
            8: [
                ("İncir", "hasat", "Kurutmalık incir hasadı. Güneşte kurutma sezonu."),
                ("Üzüm", "hasat", "Çekirdeksiz kuru üzüm hasadı devam."),
                ("Pamuk", "hasat", "İlk pamuk hasadı Aydın'da."),
            ],
            9: [
                ("Üzüm", "hasat", "Son üzüm hasadı ve kurutma işlemi."),
                ("Pamuk", "hasat", "Ana pamuk hasat ayı."),
                ("Zeytin", "bakım", "Zeytin olgunlaşıyor. Hasat hazırlığı."),
            ],
            10: [
                ("Zeytin", "hasat", "Yeşil zeytin hasadı başladı. Salamura zamanı."),
                ("Pamuk", "hasat", "Son pamuk toplama."),
                ("Bağ", "bakım", "Bağ yaprakları dökülüyor. Sonbahar gübrelemesi."),
            ],
            11: [
                ("Zeytin", "hasat", "Siyah zeytin ve yağlık zeytin hasadı."),
                ("Narenciye", "hasat", "Ege mandalinası pazarda."),
                ("Zeytin yağı", "üretim", "Zeytinyağı sıkım fabrikaları tam kapasite."),
            ],
            12: [
                ("Zeytin", "hasat", "Son zeytin hasadı. Yeni sezon yağ satışı."),
                ("Sera", "hasat", "Kış sera sebzeleri."),
                ("Bağ", "budama", "Kış budaması başlıyor."),
            ],
        }
    },

    "marmara": {
        "ad": "Marmara Bölgesi",
        "iller": ["İstanbul", "Bursa", "Balıkesir", "Tekirdağ", "Edirne", "Çanakkale", "Kocaeli", "Sakarya", "Yalova", "Bilecik"],
        "iklim": "Geçiş iklimi, şeftali-zeytin-ayçiçeği güçlü",
        "aylar": {
            1: [("Sera", "bakım", "Sera sebzeleri bakım. Yalova çiçekçiliği kış üretimi."), ("Süt", "üretim", "Bursa-Balıkesir süt üretimi yoğun. Kış yemlemesi."), ("Zeytin", "hasat", "Güney Marmara zeytini son hasat.")],
            2: [("Bağ", "budama", "Trakya bağları kış budaması."), ("Fide", "hazırlık", "Sera fide üretimi Yalova'da başlıyor."), ("Şeftali", "budama", "Bursa şeftali bahçeleri budama zamanı.")],
            3: [("Fide", "üretim", "Yalova Türkiye'nin fide başkenti. Milyonlarca fide hazır."), ("Şeftali", "çiçek", "Bursa şeftali ağaçları çiçek açtı! Don riski kritik."), ("Ayçiçeği", "hazırlık", "Trakya'da toprak hazırlığı.")],
            4: [("Ayçiçeği", "ekim", "Trakya ayçiçeği ekimi başladı."), ("Domates", "dikim", "Açık alan sebze dikimi."), ("Şeftali", "bakım", "Meyve seyreltme zamanı.")],
            5: [("Kiraz", "hasat", "Bursa-Yalova kirazı erken çeşitler."), ("Çeltik", "ekim", "Trakya ve Marmara'da pirinç ekimi."), ("Sebze", "dikim", "Tüm sebzeler toprağa indi.")],
            6: [("Kiraz", "hasat", "Kiraz hasat zirve."), ("Şeftali", "hasat", "Bursa şeftalisi başladı!"), ("Domates", "hasat", "İlk domates hasadı.")],
            7: [("Şeftali", "hasat", "Zirve şeftali sezonu. Bursa'nın gururu."), ("Domates", "hasat", "Salçalık domates."), ("Ayçiçeği", "çiçek", "Trakya sarıya boyandı! Ayçiçeği tarlası fotoğraf zamanı.")],
            8: [("Ayçiçeği", "hasat", "Ayçiçeği hasadı başladı. Yağlık tohum."), ("Üzüm", "hasat", "Trakya bağlarında hasat."), ("Şeftali", "hasat", "Son şeftali çeşitleri.")],
            9: [("Ayçiçeği", "hasat", "Son ayçiçeği hasadı."), ("Çeltik", "hasat", "Pirinç hasadı başlıyor."), ("Üzüm", "hasat", "Şaraplık üzüm hasadı.")],
            10: [("Çeltik", "hasat", "Pirinç hasadı devam."), ("Zeytin", "hasat", "Güney Marmara zeytini."), ("Kestane", "hasat", "Bursa kestanesi hasat zamanı!")],
            11: [("Zeytin", "hasat", "Zeytin hasadı ve yağ sıkımı."), ("Kestane", "hasat", "Son kestane toplama."), ("Sera", "hazırlık", "Kış serası hazırlığı.")],
            12: [("Sera", "hasat", "Kış sera ürünleri."), ("Süt", "üretim", "Kış süt üretimi, hayvan bakımı."), ("Zeytin", "hasat", "Son zeytin hasadı.")],
        }
    },

    "ic_anadolu": {
        "ad": "İç Anadolu Bölgesi",
        "iller": ["Ankara", "Konya", "Kayseri", "Eskişehir", "Sivas", "Yozgat", "Kırşehir", "Aksaray", "Karaman", "Niğde", "Nevşehir", "Kırıkkale"],
        "iklim": "Karasal, kurak, tahıl-baklagil-patates güçlü",
        "aylar": {
            1: [("Buğday", "bakım", "Kışlık buğday kış uykusunda. Kar örtüsü koruyucu."), ("Hayvancılık", "bakım", "Kış yemlemesi kritik. Silo yemi kontrolü."), ("Patates", "depolama", "Niğde patatesi depolarda. Sıcaklık 4°C sabit tutulmalı.")],
            2: [("Buğday", "bakım", "Kar erime başlıyor. Buğday tarlası kontrol."), ("Sera", "hazırlık", "Erken sera fidesi hazırlığı."), ("Baklagil", "hazırlık", "Nohut-mercimek tohum temini.")],
            3: [("Buğday", "gübreleme", "Üst gübreleme zamanı. Azotlu gübre uygula."), ("Şeker pancarı", "hazırlık", "Toprak hazırlığı ve tohum temini."), ("Patates", "hazırlık", "Tohumluk patates hazırlığı.")],
            4: [("Nohut", "ekim", "Konya-Yozgat nohut ekimi başladı."), ("Şeker pancarı", "ekim", "Pancar ekimi. Sıra arası 45 cm."), ("Patates", "ekim", "Niğde-Nevşehir patates ekimi.")],
            5: [("Mercimek", "ekim", "Kırmızı mercimek geç ekim (yazlık)."), ("Buğday", "bakım", "Buğday başak salıyor. Hastalık takibi."), ("Patates", "bakım", "İlk çapalama ve boğaz doldurma.")],
            6: [("Buğday", "hasat", "Buğday hasadı başladı! Biçerdöver sezonu."), ("Arpa", "hasat", "Arpa hasadı buğdaydan önce bitiyor."), ("Kiraz", "hasat", "Ankara-Kayseri kirazı.")],
            7: [("Buğday", "hasat", "Ana buğday hasat ayı. Türkiye'nin ekmeklik buğdayı."), ("Nohut", "hasat", "Nohut hasadı başlıyor."), ("Kayısı", "hasat", "Kayseri kayısısı.")],
            8: [("Mercimek", "hasat", "Kırmızı mercimek hasadı."), ("Patates", "hasat", "Erken patates hasadı Niğde'de."), ("Kavun", "hasat", "Ankara çavuşu kavun!")],
            9: [("Patates", "hasat", "Ana patates hasat ayı. Depolama başlıyor."), ("Şeker pancarı", "hasat", "Pancar hasadı ve fabrikaya sevk."), ("Elma", "hasat", "İç Anadolu elması.")],
            10: [("Şeker pancarı", "hasat", "Son pancar hasadı."), ("Buğday", "ekim", "Kışlık buğday ekimi başladı!"), ("Patates", "depolama", "Patates depoya girdi. Çürük ayıkla.")],
            11: [("Buğday", "ekim", "Son kışlık buğday ekimi."), ("Hayvancılık", "hazırlık", "Kış yemi stoku kontrolü."), ("Arpa", "ekim", "Kışlık arpa ekimi.")],
            12: [("Buğday", "bakım", "Kışlık ekinler toprakta. Kar bekleniyor."), ("Hayvancılık", "bakım", "Kış bakımı ve yem yönetimi."), ("Patates", "depolama", "Depo sıcaklık ve nem kontrolü.")],
        }
    },

    "karadeniz": {
        "ad": "Karadeniz Bölgesi",
        "iller": ["Trabzon", "Rize", "Artvin", "Giresun", "Ordu", "Samsun", "Sinop", "Kastamonu", "Zonguldak", "Bartın", "Düzce", "Bolu", "Tokat", "Amasya", "Çorum"],
        "iklim": "Yağışlı, nemli, çay-fındık-mısır güçlü",
        "aylar": {
            1: [("Çay", "bakım", "Çay bahçeleri kış dinlenmesinde. Budama zamanı."), ("Fındık", "budama", "Fındık bahçesi temizlik ve budama."), ("Sera", "hasat", "Samsun seralarında kış sebzesi.")],
            2: [("Çay", "budama", "Çay budaması devam. Dipten 5 cm bırak."), ("Fındık", "gübreleme", "İlk gübreleme zamanı."), ("Lahana", "hazırlık", "Karalahana fidesi hazırlığı.")],
            3: [("Çay", "bakım", "İlk sürgünler çıkıyor. Yabancı ot temizliği."), ("Mısır", "hazırlık", "Toprak hazırlığı."), ("Sebze", "fide", "Fide hazırlığı başlıyor.")],
            4: [("Çay", "bakım", "Çay yaprakları büyüyor. Nisan sonu ilk hasat."), ("Mısır", "ekim", "Mısır ekimi Samsun-Çorum hattında."), ("Kiraz", "çiçek", "Giresun kirazı çiçekte.")],
            5: [("Çay", "hasat", "İLK SÜRGÜN hasadı! En kaliteli çay. Rize'de yaş çay fabrikaları açıldı."), ("Kiraz", "hasat", "Giresun kirazı erken çeşitler."), ("Fındık", "bakım", "Fındık meyve tutma dönemi.")],
            6: [("Çay", "hasat", "İkinci sürgün çay hasadı."), ("Kiraz", "hasat", "Kiraz hasadı zirve."), ("Mısır", "bakım", "Mısır çapalama ve gübreleme.")],
            7: [("Çay", "hasat", "Üçüncü sürgün hasadı."), ("Fındık", "bakım", "Fındık olgunlaşıyor. Ağustos'a hazırlık."), ("Mısır", "bakım", "Mısır koçan bağlıyor.")],
            8: [("Fındık", "hasat", "FINDIK HASADI BAŞLADI! Giresun-Ordu-Trabzon sahilleri."), ("Çay", "hasat", "Son çay hasadı."), ("Mısır", "hasat", "Erken mısır hasadı.")],
            9: [("Fındık", "hasat", "Fındık kurutma ve satış. TMO fiyatı belirleyici."), ("Mısır", "hasat", "Ana mısır hasat ayı."), ("Elma", "hasat", "Amasya elması!")],
            10: [("Fındık", "satış", "Fındık satış dönemi. Fiyat takibi önemli."), ("Kivi", "hasat", "Doğu Karadeniz kivisi hasat zamanı."), ("Lahana", "hasat", "Karalahana hasadı. Kış hazırlığı.")],
            11: [("Kivi", "hasat", "Son kivi hasadı."), ("Çay", "bakım", "Çay bahçesi kış hazırlığı."), ("Lahana", "hasat", "Turşuluk lahana sezonu.")],
            12: [("Çay", "bakım", "Kış dinlenmesi. Toprak analizi yaptır."), ("Fındık", "bakım", "Fındık bahçesi kış bakımı."), ("Sera", "hasat", "Samsun kış seraları.")],
        }
    },

    "dogu_anadolu": {
        "ad": "Doğu Anadolu Bölgesi",
        "iller": ["Erzurum", "Van", "Ağrı", "Kars", "Iğdır", "Malatya", "Elazığ", "Bingöl", "Muş", "Bitlis", "Hakkari", "Tunceli"],
        "iklim": "Sert karasal, uzun kış, kayısı-hayvancılık güçlü",
        "aylar": {
            1: [("Hayvancılık", "bakım", "Sert kış. Ahır bakımı ve yem yönetimi kritik."), ("Bal", "hazırlık", "Arı kovanları kış bakımı."), ("Kayısı", "budama", "Malatya kayısı bahçeleri kış budaması.")],
            2: [("Hayvancılık", "bakım", "Kış devam. Kuzulama sezonu yaklaşıyor."), ("Kayısı", "budama", "Budama devam. Don hasarı kontrolü."), ("Sera", "hazırlık", "Iğdır'da sera hazırlığı.")],
            3: [("Hayvancılık", "doğum", "Kuzulama sezonu! Ahır hijyeni önemli."), ("Kayısı", "çiçek", "Malatya kayısısı çiçek açıyor. GEÇ DON BÜYÜK RİSK!"), ("Iğdır", "dikim", "Iğdır ovası erken sebze dikimi.")],
            4: [("Kayısı", "bakım", "Meyve tutma dönemi. İlaçlama programı."), ("Buğday", "ekim", "Yazlık buğday ekimi."), ("Hayvancılık", "mera", "Meraya çıkış başladı.")],
            5: [("Buğday", "bakım", "Yazlık ekinler büyüyor."), ("Bal", "üretim", "Arılar çiçeklere çıktı. Bal sezonu açıldı."), ("Patates", "ekim", "Ağrı-Erzurum patates ekimi.")],
            6: [("Bal", "hasat", "İlk bal hasadı. Çiçek balı."), ("Kayısı", "bakım", "Kayısı olgunlaşıyor."), ("Hayvancılık", "mera", "Yayla mera dönemi.")],
            7: [("Kayısı", "hasat", "MALATYA KAYISISI hasat zamanı! Dünya üretiminin %85'i."), ("Bal", "hasat", "Ana bal hasat ayı."), ("Buğday", "hasat", "Yazlık buğday hasadı.")],
            8: [("Kayısı", "kurutma", "Kayısı kurutma dönemi. Kükürtleme işlemi."), ("Patates", "hasat", "Ağrı patatesi hasat ediliyor."), ("Bal", "hasat", "Son bal hasadı.")],
            9: [("Elma", "hasat", "Ağrı-Kars elması."), ("Patates", "hasat", "Son patates hasadı."), ("Hayvancılık", "hazırlık", "Meradan dönüş. Kış yemi stoku.")],
            10: [("Buğday", "ekim", "Kışlık buğday ekimi."), ("Hayvancılık", "bakım", "Kış hazırlığı. Ahır onarım."), ("Şeker pancarı", "hasat", "Pancar hasadı.")],
            11: [("Hayvancılık", "bakım", "Kış başlıyor. Yem planlaması."), ("Buğday", "bakım", "Kışlık ekinler toprakta."), ("Bal", "bakım", "Arı kışlağı hazırlığı.")],
            12: [("Hayvancılık", "bakım", "Tam kış. Ahır sıcaklığı min 5°C."), ("Kayısı", "bakım", "Kış bakımı ve planlama."), ("Süt", "üretim", "Kış süt üretimi.")],
        }
    },

    "guneydogu": {
        "ad": "Güneydoğu Anadolu Bölgesi",
        "iller": ["Gaziantep", "Şanlıurfa", "Diyarbakır", "Mardin", "Batman", "Siirt", "Şırnak", "Kilis"],
        "iklim": "Sıcak-kurak, GAP sulama, fıstık-pamuk-buğday güçlü",
        "aylar": {
            1: [("Fıstık", "budama", "Antep fıstığı bahçeleri kış budaması."), ("Buğday", "bakım", "Kışlık buğday bakımı."), ("Zeytin", "hasat", "Son zeytin hasadı.")],
            2: [("Fıstık", "budama", "Budama devam."), ("Buğday", "gübreleme", "Üst gübreleme."), ("Badem", "çiçek", "Badem ağaçları çiçek açıyor!")],
            3: [("Buğday", "bakım", "Buğday büyüme döneminde."), ("Mercimek", "bakım", "Kırmızı mercimek bakımı."), ("Fıstık", "bakım", "İlk sürgünler çıkıyor.")],
            4: [("Pamuk", "ekim", "GAP bölgesi pamuk ekimi başladı."), ("Mercimek", "hasat", "Kışlık mercimek hasadı. Şanlıurfa mercimeği."), ("Buğday", "bakım", "Buğday başaklanıyor.")],
            5: [("Buğday", "hasat", "Erken buğday hasadı Güneydoğu'da."), ("Pamuk", "bakım", "Pamuk çapalama ve sulama."), ("Fıstık", "bakım", "Fıstık meyve tutma dönemi.")],
            6: [("Buğday", "hasat", "Ana buğday ve mercimek hasadı."), ("Pamuk", "bakım", "Pamuk büyüme döneminde. GAP sulaması kritik."), ("Karpuz", "hasat", "Diyarbakır karpuzu!")],
            7: [("Pamuk", "bakım", "Pamuk çiçek açıyor. Zararlı takibi."), ("Fıstık", "bakım", "Fıstık olgunlaşıyor."), ("Biber", "hasat", "İsot biberi hasat zamanı!")],
            8: [("Fıstık", "hasat", "ANTEP FISTIĞI hasat ayı! Çıtçıt sesi = olgun."), ("Pamuk", "hasat", "İlk pamuk hasadı."), ("İsot", "kurutma", "İsot biberi kurutma ve işleme.")],
            9: [("Fıstık", "hasat", "Fıstık hasadı devam. Kurutma ve işleme."), ("Pamuk", "hasat", "Ana pamuk hasat ayı. GAP pamuk başkenti."), ("Nar", "hasat", "Güneydoğu narı.")],
            10: [("Pamuk", "hasat", "Son pamuk toplama."), ("Buğday", "ekim", "Kışlık buğday ekimi."), ("Fıstık", "satış", "Fıstık işleme ve satış.")],
            11: [("Buğday", "ekim", "Son kışlık ekim."), ("Zeytin", "hasat", "Kilis-Gaziantep zeytini."), ("Fıstık", "bakım", "Bahçe sonbahar bakımı.")],
            12: [("Zeytin", "hasat", "Zeytin hasadı ve yağ sıkımı."), ("Buğday", "bakım", "Kışlık ekinler toprakta."), ("Hayvancılık", "bakım", "Kış bakımı.")],
        }
    },
}


def get_current_agenda(ay: int | None = None) -> list[dict]:
    """
    Tüm bölgeler için mevcut ayın tarım gündemini getir.

    Returns:
        [{"bolge": "akdeniz", "bolge_ad": "Akdeniz", "iller": [...],
          "urun": "Domates", "aksiyon": "hasat", "ipucu": "..."}]
    """
    if ay is None:
        ay = datetime.now().month

    agenda = []
    for bolge_key, bolge in BOLGESEL_TAKVIM.items():
        ay_verileri = bolge["aylar"].get(ay, [])
        for urun, aksiyon, ipucu in ay_verileri:
            agenda.append({
                "bolge": bolge_key,
                "bolge_ad": bolge["ad"],
                "iller": bolge["iller"],
                "iklim": bolge["iklim"],
                "urun": urun,
                "aksiyon": aksiyon,
                "ipucu": ipucu,
            })

    return agenda


def get_region_agenda(bolge: str, ay: int | None = None) -> list[dict]:
    """Belirli bir bölge için ayın gündemini getir."""
    if ay is None:
        ay = datetime.now().month

    bolge_data = BOLGESEL_TAKVIM.get(bolge)
    if not bolge_data:
        return []

    items = []
    for urun, aksiyon, ipucu in bolge_data["aylar"].get(ay, []):
        items.append({
            "bolge": bolge,
            "bolge_ad": bolge_data["ad"],
            "iller": bolge_data["iller"],
            "iklim": bolge_data["iklim"],
            "urun": urun,
            "aksiyon": aksiyon,
            "ipucu": ipucu,
        })
    return items


def generate_daily_topics(ay: int | None = None, adet: int = 3) -> list[str]:
    """
    Günün tarım gündeminden video konuları üret.
    Farklı bölgelerden, farklı ürünlerden seçer.

    Returns:
        ["Antalya'da sera domatesi hasadı başladı - ipuçları",
         "Trabzon'da fındık bahçesi bakımı zamanı", ...]
    """
    import random

    agenda = get_current_agenda(ay)
    if not agenda:
        return ["Mevsimsel tarım ipuçları"]

    random.shuffle(agenda)
    topics = []
    seen_products = set()

    for item in agenda:
        if item["urun"] in seen_products:
            continue

        il = random.choice(item["iller"])
        aksiyon_text = {
            "hasat": "hasadı başladı",
            "ekim": "ekimi zamanı",
            "dikim": "dikimi başlıyor",
            "bakım": "bakım zamanı",
            "budama": "budama dönemi",
            "gübreleme": "gübreleme zamanı",
            "fide": "fide hazırlığı",
            "hazırlık": "hazırlıkları başladı",
            "çiçek": "çiçek açtı",
            "kurutma": "kurutma sezonu",
            "satış": "satış dönemi",
            "üretim": "üretimi devam ediyor",
            "depolama": "depolama ipuçları",
            "doğum": "yeni sezon başlıyor",
            "mera": "mera sezonu açıldı",
        }.get(item["aksiyon"], item["aksiyon"])

        konu = f"{il}'da {item['urun'].lower()} {aksiyon_text}! {item['ipucu'][:80]}"
        topics.append(konu)
        seen_products.add(item["urun"])

        if len(topics) >= adet:
            break

    return topics


# CLI test
if __name__ == "__main__":
    import sys

    ay = int(sys.argv[1]) if len(sys.argv) > 1 else None
    print(f"\n{'='*60}")
    print(f"Tarım Takvimi - {'Şu anki ay' if not ay else f'{ay}. ay'}")
    print(f"{'='*60}\n")

    for item in get_current_agenda(ay):
        print(f"[{item['bolge_ad']:25s}] {item['urun']:20s} → {item['aksiyon']:10s}")
        print(f"  {item['ipucu']}")
        print()

    print(f"\n{'='*60}")
    print("Günün Video Konuları:")
    print(f"{'='*60}")
    for t in generate_daily_topics(ay, adet=5):
        print(f"  - {t}")
