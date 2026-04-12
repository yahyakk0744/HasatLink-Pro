import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, ChevronRight, ChevronLeft, MapPin, Eye, Trophy, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LocationPicker from '../map/LocationPicker';
import Badge from '../ui/Badge';
import {
  CATEGORIES, CATEGORY_LABELS, ALL_SUBCATEGORIES,
  PAZAR_UNITS, QUALITY_GRADES, STORAGE_TYPES,
  VEHICLE_TYPES,
  WORKER_SKILLS,
  EQUIPMENT_CONDITIONS, EQUIPMENT_BRANDS, SALE_TYPES, RENT_TYPES,
  LISTING_MODE_LABELS,
  SOIL_TYPES, LAND_UNITS, DEED_STATUSES, ZONING_STATUSES, RENT_DURATIONS_ARAZI,
  STORAGE_CAPACITY_UNITS, RENT_DURATIONS_DEPO,
  ANIMAL_BREEDS, ANIMAL_AGE_UNITS, ANIMAL_GENDERS, ANIMAL_HEALTH_DOCS, HAYVANCILIK_UNITS,
} from '../../utils/constants';
import type { Listing } from '../../types';
import { containsProfanity } from '../../utils/profanityFilter';
import { formatPrice } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface ListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Listing>) => Promise<void>;
  initialData?: Partial<Listing>;
}

/* ─── Helper Components ─── */

function SelectButtons({ options, value, onChange, color = '#2D6A4F' }: { options: readonly string[] | string[]; value: string; onChange: (v: string) => void; color?: string }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1.5 text-[10px] font-medium uppercase rounded-full transition-all active:scale-95"
          style={value === opt ? { background: color, color: '#fff' } : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-[var(--accent-green)]' : 'bg-[var(--text-tertiary)]/30'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition-colors">{label}</span>
    </label>
  );
}

function MultiSelectButtons({ options, values, onChange, color = '#2D6A4F' }: { options: string[]; values: string[]; onChange: (v: string[]) => void; color?: string }) {
  const toggle = (opt: string) => {
    if (values.includes(opt)) onChange(values.filter(v => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className="px-3 py-1.5 text-[10px] font-medium uppercase rounded-full transition-all"
          style={values.includes(opt) ? { background: color, color: '#fff' } : { background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const TURKISH_CITIES = [
  'Adana','Adiyaman','Afyonkarahisar','Agri','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin',
  'Aydin','Balikesir','Bartin','Batman','Bayburt','Bilecik','Bingol','Bitlis','Bolu','Burdur',
  'Bursa','Canakkale','Cankiri','Corum','Denizli','Diyarbakir','Duzce','Edirne','Elazig','Erzincan',
  'Erzurum','Eskisehir','Gaziantep','Giresun','Gumushane','Hakkari','Hatay','Igdir','Isparta','Istanbul',
  'Izmir','Kahramanmaras','Karabuk','Karaman','Kars','Kastamonu','Kayseri','Kirikkale','Kirklareli','Kirsehir',
  'Kilis','Kocaeli','Konya','Kutahya','Malatya','Manisa','Mardin','Mersin','Mugla','Mus',
  'Nevsehir','Nigde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Sanliurfa','Siirt','Sinop',
  'Sirnak','Sivas','Tekirdag','Tokat','Trabzon','Tunceli','Usak','Van','Yalova','Yozgat','Zonguldak',
];

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <div className="h-px flex-1 bg-[var(--divider)]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">{children}</span>
      <div className="h-px flex-1 bg-[var(--divider)]" />
    </div>
  );
}

/* ─── Step Indicator ─── */

const STEPS = [
  { key: 'images', icon: '1' },
  { key: 'details', icon: '2' },
  { key: 'location', icon: '3' },
] as const;

function StepIndicator({ current, onStep }: { current: number; onStep: (s: number) => void }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const labels = lang === 'tr'
    ? ['Görseller', 'Detaylar', 'Konum & Yayınla']
    : ['Images', 'Details', 'Location & Publish'];

  return (
    <div className="flex items-center justify-between px-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <button
            type="button"
            onClick={() => onStep(i)}
            className={`flex items-center gap-2 transition-all ${i <= current ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < current ? 'bg-[var(--accent-green)] text-white' :
              i === current ? 'bg-[var(--accent-green)] text-white ring-4 ring-[var(--accent-green)]/20' :
              'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}>
              {i < current ? <Check size={14} /> : step.icon}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide hidden sm:block">{labels[i]}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-3 transition-colors duration-300 ${i < current ? 'bg-[var(--accent-green)]' : 'bg-[var(--border-default)]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Live Preview Card ─── */

function LivePreview({ data, lang }: { data: Partial<Listing>; lang: string }) {
  const catLabel = CATEGORY_LABELS[data.type || 'pazar'];
  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      <div className="relative aspect-[4/3] bg-[var(--bg-input)] overflow-hidden">
        {data.images?.[0] ? (
          <img src={data.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--text-tertiary)]">
            {catLabel?.icon || '?'}
          </div>
        )}
        {data.type === 'pazar' && (data.price || 0) > 0 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
            <span className="text-xs font-bold text-white">{formatPrice(data.price || 0)}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge color="#2D6A4F">{catLabel?.[lang as 'tr' | 'en'] || data.type}</Badge>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold tracking-tight line-clamp-1 mb-0.5">
          {data.title || (lang === 'tr' ? 'İlan Başlığı' : 'Listing Title')}
        </h3>
        <p className={`text-sm font-bold tracking-tight mb-1.5 ${data.listingMode === 'buy' ? 'text-[#0077B6]' : 'text-[var(--accent-green)]'}`}>
          {formatPrice(data.price || 0)}
        </p>
        {data.location && (
          <div className="flex items-center gap-1 text-[9px] text-[var(--text-secondary)]">
            <MapPin size={8} />{data.location}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Form ─── */

export default function ListingForm({ isOpen, onClose, onSubmit, initialData }: ListingFormProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // Common
  const [type, setType] = useState(initialData?.type || 'pazar');
  const [listingMode, setListingMode] = useState<'sell' | 'buy'>(initialData?.listingMode || 'sell');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || 'kg');
  const [location, setLocation] = useState(initialData?.location || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [coordLat, setCoordLat] = useState(initialData?.coordinates?.lat || 0);
  const [coordLng, setCoordLng] = useState(initialData?.coordinates?.lng || 0);
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  // Pazar
  const [harvestDate, setHarvestDate] = useState(initialData?.harvestDate || '');
  const [isOrganic, setIsOrganic] = useState(initialData?.isOrganic || false);
  const [qualityGrade, setQualityGrade] = useState(initialData?.qualityGrade || '');
  const [storageType, setStorageType] = useState(initialData?.storageType || '');
  const [minOrderAmount, setMinOrderAmount] = useState(initialData?.minOrderAmount?.toString() || '');

  // Lojistik
  const [isFrigo, setIsFrigo] = useState(initialData?.isFrigo || false);
  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || '');
  const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '');
  const [routeFrom, setRouteFrom] = useState(initialData?.routeFrom || '');
  const [routeTo, setRouteTo] = useState(initialData?.routeTo || '');
  const [availableDate, setAvailableDate] = useState(initialData?.availableDate || '');
  const [hasInsurance, setHasInsurance] = useState(initialData?.hasInsurance || false);
  const [plateNumber, setPlateNumber] = useState(initialData?.plateNumber || '');

  // Isgucu
  const [isTeam, setIsTeam] = useState(initialData?.isTeam || false);
  const [workerCount, setWorkerCount] = useState(initialData?.workerCount?.toString() || '1');
  const [experienceYears, setExperienceYears] = useState(initialData?.experienceYears?.toString() || '');
  const [dailyWage, setDailyWage] = useState(initialData?.dailyWage?.toString() || '');
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);

  // Ekipman
  const [rentType, setRentType] = useState(initialData?.rentType || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [modelName, setModelName] = useState(initialData?.modelName || '');
  const [yearOfManufacture, setYearOfManufacture] = useState(initialData?.yearOfManufacture?.toString() || '');
  const [condition, setCondition] = useState(initialData?.condition || '');
  const [horsePower, setHorsePower] = useState(initialData?.horsePower?.toString() || '');
  const [saleType, setSaleType] = useState(initialData?.saleType || '');

  // Arazi
  const [landSize, setLandSize] = useState(initialData?.landSize?.toString() || '');
  const [landUnit, setLandUnit] = useState(initialData?.landUnit || 'donum');
  const [soilType, setSoilType] = useState(initialData?.soilType || '');
  const [waterAvailable, setWaterAvailable] = useState(initialData?.waterAvailable || false);
  const [hasElectricity, setHasElectricity] = useState(initialData?.hasElectricity || false);
  const [deedStatus, setDeedStatus] = useState(initialData?.deedStatus || '');
  const [zoningStatus, setZoningStatus] = useState(initialData?.zoningStatus || '');
  const [rentDuration, setRentDuration] = useState(initialData?.rentDuration || '');

  // Depolama
  const [storageCapacity, setStorageCapacity] = useState(initialData?.storageCapacity?.toString() || '');
  const [storageCapacityUnit, setStorageCapacityUnit] = useState(initialData?.storageCapacityUnit || 'ton');
  const [temperatureMin, setTemperatureMin] = useState(initialData?.temperatureMin?.toString() || '');
  const [temperatureMax, setTemperatureMax] = useState(initialData?.temperatureMax?.toString() || '');
  const [hasSecurity, setHasSecurity] = useState(initialData?.hasSecurity || false);
  const [has24Access, setHas24Access] = useState(initialData?.has24Access || false);
  const [isNegotiable, setIsNegotiable] = useState(initialData?.is_negotiable || false);
  const [needsTransport, setNeedsTransport] = useState(initialData?.needsTransport || false);
  const [hasTransportCapacity, setHasTransportCapacity] = useState(initialData?.hasTransportCapacity || false);

  // Hayvancılık
  const [animalBreed, setAnimalBreed] = useState((initialData as any)?.animalBreed || '');
  const [animalAge, setAnimalAge] = useState((initialData as any)?.animalAge?.toString() || '');
  const [animalAgeUnit, setAnimalAgeUnit] = useState((initialData as any)?.animalAgeUnit || 'AY');
  const [animalGender, setAnimalGender] = useState((initialData as any)?.animalGender || '');
  const [animalCount, setAnimalCount] = useState((initialData as any)?.animalCount?.toString() || '');
  const [healthDocs, setHealthDocs] = useState<string[]>((initialData as any)?.healthDocs || []);
  const [earTagNumber, setEarTagNumber] = useState((initialData as any)?.earTagNumber || '');
  const [isVaccinated, setIsVaccinated] = useState((initialData as any)?.isVaccinated || false);
  const [animalWeight, setAnimalWeight] = useState((initialData as any)?.weight?.toString() || '');

  // Video & Documents
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>(initialData?.documents || []);

  // Scheduling
  const [scheduledDate, setScheduledDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);

  // New fields
  const [paymentMethod, setPaymentMethod] = useState((initialData as any)?.paymentMethod || '');
  const [deliveryOption, setDeliveryOption] = useState((initialData as any)?.deliveryOption || '');
  const [productOrigin, setProductOrigin] = useState((initialData as any)?.productOrigin || '');
  const [returnRoute, setReturnRoute] = useState((initialData as any)?.returnRoute || false);
  const [needsAccommodation, setNeedsAccommodation] = useState((initialData as any)?.needsAccommodation || false);
  const [monthlyWage, setMonthlyWage] = useState((initialData as any)?.monthlyWage?.toString() || '');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState((initialData as any)?.lastMaintenanceDate || '');
  const [cropHistory, setCropHistory] = useState((initialData as any)?.cropHistory || '');
  const [altitude, setAltitude] = useState((initialData as any)?.altitude?.toString() || '');
  const [humidityControl, setHumidityControl] = useState((initialData as any)?.humidityControl || false);

  const subCategories = CATEGORIES[type as keyof typeof CATEGORIES]?.filter(c => c !== 'HEPSİ') || [];
  const productOptions = subCategory ? (ALL_SUBCATEGORIES[type]?.[subCategory] || []) : [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Build preview data
  const previewData = useMemo<Partial<Listing>>(() => ({
    type: type as Listing['type'],
    listingMode,
    title, price: parseFloat(price) || 0, location, images,
    subCategory, isOrganic,
  }), [type, listingMode, title, price, location, images, subCategory, isOrganic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (containsProfanity(title) || containsProfanity(description)) {
      toast.error(lang === 'tr' ? 'Uygunsuz içerik tespit edildi, lütfen düzenleyin' : 'Inappropriate content detected');
      return;
    }
    setLoading(true);
    try {
      const data: Partial<Listing> = {
        type: type as Listing['type'],
        listingMode,
        subCategory, title, description,
        price: parseFloat(price) || 0,
        amount: parseFloat(amount) || 0,
        unit, location, phone, images,
        coordinates: coordLat && coordLng ? { lat: coordLat, lng: coordLng } : undefined,
        is_negotiable: isNegotiable,
        needsTransport,
        hasTransportCapacity,
        ...(paymentMethod && { paymentMethod }),
        ...(videoUrl && { videoUrl }),
        ...(documents.length > 0 && { documents }),
        ...(scheduledDate && { scheduledAt: new Date(scheduledDate).toISOString() }),
        ...(autoRenew && { autoRenew: true }),
      } as any;

      if (type === 'pazar') {
        data.harvestDate = harvestDate;
        data.isOrganic = isOrganic;
        data.qualityGrade = qualityGrade;
        data.storageType = storageType;
        data.minOrderAmount = parseFloat(minOrderAmount) || 0;
        if (deliveryOption) (data as any).deliveryOption = deliveryOption;
        if (productOrigin) (data as any).productOrigin = productOrigin;
      } else if (type === 'lojistik') {
        data.subCategory = vehicleType;
        data.isFrigo = vehicleType === 'FRIGO KAMYON' ? true : isFrigo;
        data.vehicleType = vehicleType;
        data.capacity = parseFloat(capacity) || 0;
        data.routeFrom = routeFrom;
        data.routeTo = routeTo;
        data.availableDate = availableDate;
        data.hasInsurance = hasInsurance;
        data.plateNumber = plateNumber;
        (data as any).returnRoute = returnRoute;
      } else if (type === 'isgucu') {
        data.isTeam = isTeam;
        data.workerCount = parseInt(workerCount) || 1;
        data.experienceYears = parseInt(experienceYears) || 0;
        data.dailyWage = parseFloat(dailyWage) || 0;
        data.skills = skills;
        (data as any).needsAccommodation = needsAccommodation;
        if (monthlyWage) (data as any).monthlyWage = parseFloat(monthlyWage) || 0;
      } else if (type === 'ekipman') {
        data.rentType = rentType;
        data.brand = brand;
        data.modelName = modelName;
        data.yearOfManufacture = parseInt(yearOfManufacture) || 0;
        data.condition = condition;
        data.horsePower = parseInt(horsePower) || 0;
        data.saleType = saleType;
        if (lastMaintenanceDate) (data as any).lastMaintenanceDate = lastMaintenanceDate;
      } else if (type === 'arazi') {
        data.landSize = parseFloat(landSize) || 0;
        data.landUnit = landUnit;
        data.soilType = soilType;
        data.waterAvailable = waterAvailable;
        data.hasElectricity = hasElectricity;
        data.deedStatus = deedStatus;
        data.zoningStatus = zoningStatus;
        data.rentDuration = rentDuration;
        if (cropHistory) (data as any).cropHistory = cropHistory;
        if (altitude) (data as any).altitude = parseFloat(altitude) || 0;
      } else if (type === 'depolama') {
        data.storageCapacity = parseFloat(storageCapacity) || 0;
        data.storageCapacityUnit = storageCapacityUnit;
        data.temperatureMin = parseFloat(temperatureMin) || 0;
        data.temperatureMax = parseFloat(temperatureMax) || 0;
        data.hasSecurity = hasSecurity;
        data.has24Access = has24Access;
        data.rentDuration = rentDuration;
        (data as any).humidityControl = humidityControl;
      } else if (type === 'hayvancilik') {
        (data as any).animalBreed = animalBreed;
        (data as any).animalAge = parseInt(animalAge) || 0;
        (data as any).animalAgeUnit = animalAgeUnit;
        (data as any).animalGender = animalGender;
        (data as any).animalCount = parseInt(animalCount) || 0;
        (data as any).healthDocs = healthDocs;
        (data as any).earTagNumber = earTagNumber;
        (data as any).isVaccinated = isVaccinated;
        (data as any).weight = parseFloat(animalWeight) || 0;
      }

      await onSubmit(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return images.length > 0 || true; // images optional
    if (step === 1) return title.length > 0 && (parseFloat(price) || 0) > 0;
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('edit') : t('listing.create')} size="full">
      <form onSubmit={handleSubmit}>
        {/* Step Indicator */}
        <StepIndicator current={step} onStep={setStep} />

        <div className="flex gap-6">
          {/* Main Form Area */}
          <div className="flex-1 min-w-0">

            {/* ═══════════ STEP 1: IMAGES ═══════════ */}
            {step === 0 && (
              <div className="space-y-5 animate-fade-in">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">{t('listing.type')}</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setType(key as typeof type); setSubCategory(''); }}
                        className={`px-4 py-2 text-xs font-semibold uppercase rounded-full transition-all ${
                          type === key ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {cat.icon} {cat.tr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Listing Mode */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">{t('listing.listingMode')}</label>
                  <div className="flex gap-2">
                    {(['sell', 'buy'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setListingMode(mode)}
                        className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase rounded-full transition-all ${
                          listingMode === mode
                            ? mode === 'sell' ? 'bg-[#2D6A4F] text-white' : 'bg-[#0077B6] text-white'
                            : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {LISTING_MODE_LABELS[type]?.[mode]?.[lang] || (mode === 'sell' ? t('listing.modeSell') : t('listing.modeBuy'))}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Glassmorphism Image Upload Area */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">{t('listing.images')}</label>
                  <div className="p-5 rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-lg">
                    <div className="flex gap-3 flex-wrap">
                      {images.map((img, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-md">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                          {i === 0 && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[var(--accent-green)] text-white text-[8px] font-bold uppercase rounded-full">
                              {lang === 'tr' ? 'Kapak' : 'Cover'}
                            </div>
                          )}
                        </div>
                      ))}
                      <label className="w-24 h-24 border-2 border-dashed border-[var(--accent-green)]/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-green)] hover:bg-[var(--accent-green)]/5 transition-all group">
                        <ImagePlus size={24} className="text-[var(--text-tertiary)] group-hover:text-[var(--accent-green)] transition-colors" />
                        <span className="text-[9px] font-medium text-[var(--text-tertiary)] mt-1 group-hover:text-[var(--accent-green)]">
                          {lang === 'tr' ? 'Ekle' : 'Add'}
                        </span>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-3">
                      {lang === 'tr' ? 'İlk görsel kapak fotoğrafı olarak kullanılır. En fazla 8 görsel yükleyebilirsiniz.' : 'First image will be used as cover. You can upload up to 8 images.'}
                    </p>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                    {lang === 'tr' ? 'Video Bağlantısı (Opsiyonel)' : 'Video URL (Optional)'}
                  </label>
                  <Input
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... veya video URL"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">YouTube veya doğrudan video bağlantısı ekleyebilirsiniz.</p>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">
                    {lang === 'tr' ? 'Belgeler & Sertifikalar (Opsiyonel)' : 'Documents & Certificates (Optional)'}
                  </label>
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-[var(--bg-input)]">
                      <span className="text-xs flex-1 truncate">{doc.name}</span>
                      <button type="button" onClick={() => setDocuments(prev => prev.filter((_, j) => j !== i))} className="p-1 text-[var(--text-secondary)] hover:text-red-500">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-[var(--border-default)] rounded-xl cursor-pointer hover:border-[#0077B6] hover:bg-[#0077B6]/5 transition-all">
                    <ImagePlus size={16} className="text-[var(--text-tertiary)]" />
                    <span className="text-xs text-[var(--text-tertiary)]">{lang === 'tr' ? 'Belge Ekle (PDF, görsel)' : 'Add Document'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (reader.result) {
                              setDocuments(prev => [...prev, { name: file.name, url: reader.result as string }]);
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </label>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Organik sertifika, analiz raporu vb. belgeler ekleyebilirsiniz.</p>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 2: DETAILS ═══════════ */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                {/* Sub Category */}
                {type !== 'lojistik' && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">{t('listing.subCategory')}</label>
                    <div className="flex gap-2 flex-wrap">
                      {subCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setSubCategory(cat); setTitle(''); }}
                          className={`px-3 py-1.5 text-[10px] font-medium uppercase rounded-full transition-all ${
                            subCategory === cat ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Selection */}
                {productOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-2">{t('listing.product') || 'Urun Secin'}</label>
                    <select
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    >
                      <option value="">{t('listing.selectProduct') || 'Urun secin...'}</option>
                      {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                <Input label={t('listing.title')} value={title} onChange={e => setTitle(e.target.value)} required />

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.description')}</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                  />
                </div>

                {/* === PAZAR SPECIFIC === */}
                {type === 'pazar' && (
                  <>
                    <SectionTitle>{t('listing.pazarDetails')}</SectionTitle>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL/birim)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      <Input label={t('listing.amount')} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.unit')}</label>
                        <SelectButtons options={PAZAR_UNITS} value={unit} onChange={setUnit} />
                      </div>
                    </div>
                    {listingMode === 'sell' && (
                      <Input label={t('listing.minOrder')} type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} />
                    )}
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                        {listingMode === 'buy' ? t('listing.minQualityWanted') : t('listing.quality')}
                      </label>
                      <SelectButtons options={QUALITY_GRADES} value={qualityGrade} onChange={setQualityGrade} />
                    </div>
                    {listingMode === 'sell' && (
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.storage')}</label>
                        <SelectButtons options={STORAGE_TYPES} value={storageType} onChange={setStorageType} />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={listingMode === 'buy' ? t('listing.deliveryDateNeeded') : t('listing.harvestDate')} type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} />
                      <div className="flex items-end pb-1">
                        <ToggleSwitch label={t('listing.organic')} checked={isOrganic} onChange={setIsOrganic} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">Teslimat Seçeneği</label>
                        <SelectButtons options={['TARLADAN TESLİM', 'ADRESE TESLİM', 'DEPODAN TESLİM', 'ALICI ALIR']} value={deliveryOption} onChange={setDeliveryOption} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">Ödeme Yöntemi</label>
                        <SelectButtons options={['NAKİT', 'HAVALE/EFT', 'KREDİ KARTI', 'ÇEKE UYGUN']} value={paymentMethod} onChange={setPaymentMethod} />
                      </div>
                    </div>
                    <Input label="Ürün Kökeni / Yöre" value={productOrigin} onChange={e => setProductOrigin(e.target.value)} />
                  </>
                )}

                {/* === LOJISTIK SPECIFIC === */}
                {type === 'lojistik' && (
                  <>
                    <SectionTitle>{t('listing.lojistikDetails')}</SectionTitle>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                        {listingMode === 'buy' ? t('listing.neededVehicleType') : t('listing.vehicleType')}
                      </label>
                      <SelectButtons options={VEHICLE_TYPES} value={vehicleType} onChange={(v) => { setVehicleType(v); if (v === 'FRIGO KAMYON') setIsFrigo(true); }} color="#0077B6" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      <Input label={listingMode === 'buy' ? t('listing.cargoWeight') : t('listing.capacity')} type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={t('listing.routeFrom')} value={routeFrom} onChange={e => setRouteFrom(e.target.value)} />
                      <Input label={t('listing.routeTo')} value={routeTo} onChange={e => setRouteTo(e.target.value)} />
                    </div>
                    <div className={`grid ${listingMode === 'sell' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                      <Input label={t('listing.availableDate')} type="date" value={availableDate} onChange={e => setAvailableDate(e.target.value)} />
                      {listingMode === 'sell' && (
                        <Input label={t('listing.plateNumber')} value={plateNumber} onChange={e => setPlateNumber(e.target.value)} />
                      )}
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                      {vehicleType !== 'FRIGO KAMYON' && (
                        <ToggleSwitch label={t('listing.frigo')} checked={isFrigo} onChange={setIsFrigo} />
                      )}
                      <ToggleSwitch label={t('listing.insurance')} checked={hasInsurance} onChange={setHasInsurance} />
                      <ToggleSwitch label="Dönüş Yükü Aranıyor" checked={returnRoute} onChange={setReturnRoute} />
                    </div>
                  </>
                )}

                {/* === ISGUCU SPECIFIC === */}
                {type === 'isgucu' && (
                  <>
                    <SectionTitle>{t('listing.isgucuDetails')}</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.offeredWage') : t('listing.dailyWage')) + ' (TL)'} type="number" value={dailyWage} onChange={e => setDailyWage(e.target.value)} />
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL toplam)'} type="number" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <ToggleSwitch label={t('listing.team')} checked={isTeam} onChange={(v) => { setIsTeam(v); if (!v) setWorkerCount('1'); }} />
                    <div className={`grid ${isTeam ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                      {isTeam && (
                        <Input label={listingMode === 'buy' ? t('listing.neededWorkers') : t('listing.workerCount')} type="number" value={workerCount} onChange={e => setWorkerCount(e.target.value)} />
                      )}
                      <Input label={t('listing.experience')} type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                        {listingMode === 'buy' ? t('listing.requiredSkills') : t('listing.skills')}
                      </label>
                      <MultiSelectButtons options={WORKER_SKILLS} values={skills} onChange={setSkills} color="#A47148" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Aylık Ücret (TL)" type="number" value={monthlyWage} onChange={e => setMonthlyWage(e.target.value)} />
                      <div className="flex items-end pb-1">
                        <ToggleSwitch label="Konaklama Gerekli" checked={needsAccommodation} onChange={setNeedsAccommodation} />
                      </div>
                    </div>
                  </>
                )}

                {/* === EKIPMAN SPECIFIC === */}
                {type === 'ekipman' && (
                  <>
                    <SectionTitle>{t('listing.ekipmanDetails')}</SectionTitle>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.saleType')}</label>
                      <SelectButtons options={SALE_TYPES} value={saleType} onChange={setSaleType} color="#A47148" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      {saleType !== 'SATILIK' && (
                        <div>
                          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.rentType')}</label>
                          <SelectButtons options={RENT_TYPES} value={rentType} onChange={setRentType} color="#A47148" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                        {listingMode === 'buy' ? t('listing.preferredBrand') : t('listing.brand')}
                      </label>
                      <SelectButtons options={EQUIPMENT_BRANDS} value={brand} onChange={setBrand} color="#1A1A1A" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label={listingMode === 'buy' ? t('listing.preferredModel') : t('listing.modelName')} value={modelName} onChange={e => setModelName(e.target.value)} />
                      <Input label={t('listing.year')} type="number" value={yearOfManufacture} onChange={e => setYearOfManufacture(e.target.value)} />
                      <Input label={t('listing.horsePower')} type="number" value={horsePower} onChange={e => setHorsePower(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
                        {listingMode === 'buy' ? t('listing.minCondition') : t('listing.condition')}
                      </label>
                      <SelectButtons options={EQUIPMENT_CONDITIONS} value={condition} onChange={setCondition} />
                    </div>
                    {listingMode === 'sell' && (
                      <Input label="Son Bakım Tarihi" type="date" value={lastMaintenanceDate} onChange={e => setLastMaintenanceDate(e.target.value)} />
                    )}
                  </>
                )}

                {/* === ARAZI SPECIFIC === */}
                {type === 'arazi' && (
                  <>
                    <SectionTitle>{t('listing.araziDetails')}</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-2">
                        <Input label={t('listing.landSize')} type="number" value={landSize} onChange={e => setLandSize(e.target.value)} />
                        <div>
                          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.landUnit')}</label>
                          <SelectButtons options={LAND_UNITS} value={landUnit} onChange={setLandUnit} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.soilType')}</label>
                      <SelectButtons options={SOIL_TYPES} value={soilType} onChange={setSoilType} color="#A47148" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.deedStatus')}</label>
                      <SelectButtons options={DEED_STATUSES} value={deedStatus} onChange={setDeedStatus} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.zoningStatus')}</label>
                      <SelectButtons options={ZONING_STATUSES} value={zoningStatus} onChange={setZoningStatus} />
                    </div>
                    {listingMode === 'buy' && (
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.rentDuration')}</label>
                        <SelectButtons options={RENT_DURATIONS_ARAZI} value={rentDuration} onChange={setRentDuration} color="#0077B6" />
                      </div>
                    )}
                    <div className="flex items-center gap-6">
                      <ToggleSwitch label={t('listing.waterAvailable')} checked={waterAvailable} onChange={setWaterAvailable} />
                      <ToggleSwitch label={t('listing.hasElectricity')} checked={hasElectricity} onChange={setHasElectricity} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Geçmiş Ürün (Ekim Geçmişi)" value={cropHistory} onChange={e => setCropHistory(e.target.value)} />
                      <Input label="Rakım (metre)" type="number" value={altitude} onChange={e => setAltitude(e.target.value)} />
                    </div>
                  </>
                )}

                {/* === DEPOLAMA SPECIFIC === */}
                {type === 'depolama' && (
                  <>
                    <SectionTitle>{t('listing.depolamaDetails')}</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (TL)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-2">
                        <Input label={t('listing.storageCapacity')} type="number" value={storageCapacity} onChange={e => setStorageCapacity(e.target.value)} />
                        <div>
                          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.capacityUnit')}</label>
                          <SelectButtons options={STORAGE_CAPACITY_UNITS} value={storageCapacityUnit} onChange={setStorageCapacityUnit} />
                        </div>
                      </div>
                    </div>
                    {subCategory === 'SOGUK HAVA DEPOSU' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input label={t('listing.temperatureMin') + ' (C)'} type="number" value={temperatureMin} onChange={e => setTemperatureMin(e.target.value)} />
                        <Input label={t('listing.temperatureMax') + ' (C)'} type="number" value={temperatureMax} onChange={e => setTemperatureMax(e.target.value)} />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.rentDuration')}</label>
                      <SelectButtons options={RENT_DURATIONS_DEPO} value={rentDuration} onChange={setRentDuration} color="#0077B6" />
                    </div>
                    {subCategory && subCategory !== 'ACIK DEPO' && (
                      <div className="flex items-center gap-6 flex-wrap">
                        <ToggleSwitch label={t('listing.hasSecurity')} checked={hasSecurity} onChange={setHasSecurity} />
                        <ToggleSwitch label={t('listing.has24Access')} checked={has24Access} onChange={setHas24Access} />
                        <ToggleSwitch label="Nem Kontrolü" checked={humidityControl} onChange={setHumidityControl} />
                      </div>
                    )}
                  </>
                )}

                {/* === HAYVANCILIK SPECIFIC === */}
                {type === 'hayvancilik' && (
                  <>
                    <SectionTitle>{lang === 'tr' ? 'Hayvancılık Detayları' : 'Livestock Details'}</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={(listingMode === 'buy' ? (lang === 'tr' ? 'Bütçe' : 'Budget') : (lang === 'tr' ? 'Fiyat' : 'Price')) + ' (TL)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-2">
                        <Input label={lang === 'tr' ? 'Miktar' : 'Amount'} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                        <div>
                          <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{lang === 'tr' ? 'Birim' : 'Unit'}</label>
                          <SelectButtons options={HAYVANCILIK_UNITS} value={unit} onChange={setUnit} />
                        </div>
                      </div>
                    </div>
                    {(subCategory === 'BÜYÜKBAŞ' || subCategory === 'KÜÇÜKBAŞ' || subCategory === 'KANATLI') && ANIMAL_BREEDS[subCategory] && (
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{lang === 'tr' ? 'Irk' : 'Breed'}</label>
                        <SelectButtons options={ANIMAL_BREEDS[subCategory]} value={animalBreed} onChange={setAnimalBreed} color="#A47148" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{lang === 'tr' ? 'Cinsiyet' : 'Gender'}</label>
                      <SelectButtons options={ANIMAL_GENDERS} value={animalGender} onChange={setAnimalGender} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label={lang === 'tr' ? 'Yaş' : 'Age'} type="number" value={animalAge} onChange={e => setAnimalAge(e.target.value)} />
                      <div>
                        <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{lang === 'tr' ? 'Yaş Birimi' : 'Age Unit'}</label>
                        <SelectButtons options={ANIMAL_AGE_UNITS} value={animalAgeUnit} onChange={setAnimalAgeUnit} />
                      </div>
                      <Input label={lang === 'tr' ? 'Ağırlık (kg)' : 'Weight (kg)'} type="number" value={animalWeight} onChange={e => setAnimalWeight(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={lang === 'tr' ? 'Adet / Baş Sayısı' : 'Head Count'} type="number" value={animalCount} onChange={e => setAnimalCount(e.target.value)} />
                      <Input label={lang === 'tr' ? 'Kulak Küpe No' : 'Ear Tag Number'} value={earTagNumber} onChange={e => setEarTagNumber(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{lang === 'tr' ? 'Sağlık Belgeleri' : 'Health Documents'}</label>
                      <MultiSelectButtons options={ANIMAL_HEALTH_DOCS} values={healthDocs} onChange={setHealthDocs} color="#2D6A4F" />
                    </div>
                    <ToggleSwitch label={lang === 'tr' ? 'Aşıları Tam' : 'Vaccinated'} checked={isVaccinated} onChange={setIsVaccinated} />
                  </>
                )}
              </div>
            )}

            {/* ═══════════ STEP 3: LOCATION & PUBLISH ═══════════ */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {/* Negotiable Toggle */}
                <div className="flex items-center gap-3 py-3 px-4 bg-[#E76F00]/5 rounded-2xl border border-[#E76F00]/10">
                  <ToggleSwitch label={lang === 'tr' ? 'Pazarlığa Açık' : 'Negotiable'} checked={isNegotiable} onChange={setIsNegotiable} />
                  <span className="text-[10px] text-[#E76F00]">{lang === 'tr' ? 'Alıcılar fiyat teklifi gönderebilir' : 'Buyers can send price offers'}</span>
                </div>

                {/* Transport Options */}
                {type !== 'lojistik' && (
                  <div className="flex items-center gap-3 py-3 px-4 bg-[#0077B6]/5 rounded-2xl border border-[#0077B6]/10">
                    <ToggleSwitch label={lang === 'tr' ? 'Nakliye Arıyorum' : 'Need Transport'} checked={needsTransport} onChange={(v) => { setNeedsTransport(v); if (v) setHasTransportCapacity(false); }} />
                    <span className="text-[10px] text-[#0077B6]">{lang === 'tr' ? 'Ürünüm için nakliye desteği arıyorum' : 'I need transport support'}</span>
                  </div>
                )}
                {type === 'lojistik' && (
                  <div className="flex items-center gap-3 py-3 px-4 bg-[#0077B6]/5 rounded-2xl border border-[#0077B6]/10">
                    <ToggleSwitch label={lang === 'tr' ? 'Boş Kapasitem Var' : 'Available Capacity'} checked={hasTransportCapacity} onChange={(v) => { setHasTransportCapacity(v); if (v) setNeedsTransport(false); }} />
                    <span className="text-[10px] text-[#0077B6]">{lang === 'tr' ? 'Boş dönüş veya ekstra kapasite mevcut' : 'Empty return or extra capacity available'}</span>
                  </div>
                )}

                {/* Location & Phone */}
                <SectionTitle>{t('listing.contactInfo')}</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">{t('listing.location')}</label>
                    <select
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                    >
                      <option value="">{lang === 'tr' ? 'İl Seçin' : 'Select City'}</option>
                      {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <Input label={t('listing.phone')} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                {/* Map */}
                <LocationPicker
                  lat={coordLat || undefined}
                  lng={coordLng || undefined}
                  onSelect={(lat, lng) => { setCoordLat(lat); setCoordLng(lng); }}
                />

                {/* Scheduled Publish */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                    {lang === 'tr' ? 'Zamanlı Yayın (Opsiyonel)' : 'Scheduled Publish (Optional)'}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    {lang === 'tr' ? 'Boş bırakırsanız hemen yayınlanır. Tarih seçerseniz o zaman yayınlanır.' : 'Leave empty to publish now.'}
                  </p>
                </div>

                {/* Auto Renewal */}
                <div className="flex items-center gap-3 py-3 px-4 bg-[#2D6A4F]/5 rounded-2xl border border-[#2D6A4F]/10">
                  <ToggleSwitch
                    label={lang === 'tr' ? 'Otomatik Yenile' : 'Auto Renew'}
                    checked={autoRenew}
                    onChange={setAutoRenew}
                  />
                  <span className="text-[10px] text-[#2D6A4F]">
                    {lang === 'tr' ? '30 gün sonunda ilan otomatik yenilenir' : 'Listing auto-renews after 30 days'}
                  </span>
                </div>

                {/* +10 Hasat Puan Motivation */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#2D6A4F]/10 via-[#40916C]/5 to-[#E76F00]/10 border border-[#2D6A4F]/20">
                  <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center">
                    <Trophy size={20} className="text-[#2D6A4F]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2D6A4F]">+10 Hasat Puan {lang === 'tr' ? 'kazanacaksın!' : 'you will earn!'}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{lang === 'tr' ? 'Bu ilanı yayınlayarak sadakat puanı kazan' : 'Earn loyalty points by publishing this listing'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Template Save/Load */}
            {step === 2 && (
              <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => {
                    const tpl = { type, listingMode, subCategory, unit, qualityGrade, storageType, isOrganic, location, phone, videoUrl };
                    localStorage.setItem(`hl-template-${type}`, JSON.stringify(tpl));
                    toast.success(lang === 'tr' ? 'Şablon kaydedildi!' : 'Template saved!');
                  }}
                  className="px-3 py-1.5 text-[10px] font-medium bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
                >
                  {lang === 'tr' ? '💾 Şablon Kaydet' : '💾 Save Template'}
                </button>
                {localStorage.getItem(`hl-template-${type}`) && (
                  <button
                    type="button"
                    onClick={() => {
                      const raw = localStorage.getItem(`hl-template-${type}`);
                      if (!raw) return;
                      try {
                        const tpl = JSON.parse(raw);
                        if (tpl.subCategory) setSubCategory(tpl.subCategory);
                        if (tpl.unit) setUnit(tpl.unit);
                        if (tpl.qualityGrade) setQualityGrade(tpl.qualityGrade);
                        if (tpl.storageType) setStorageType(tpl.storageType);
                        if (tpl.isOrganic !== undefined) setIsOrganic(tpl.isOrganic);
                        if (tpl.location) setLocation(tpl.location);
                        if (tpl.phone) setPhone(tpl.phone);
                        if (tpl.videoUrl) setVideoUrl(tpl.videoUrl);
                        toast.success(lang === 'tr' ? 'Şablon yüklendi!' : 'Template loaded!');
                      } catch {}
                    }}
                    className="px-3 py-1.5 text-[10px] font-medium bg-[#0077B6]/10 text-[#0077B6] hover:bg-[#0077B6]/20 rounded-lg transition-colors"
                  >
                    {lang === 'tr' ? '📋 Şablonu Yükle' : '📋 Load Template'}
                  </button>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-6 mt-4 border-t border-[var(--border-default)]">
              {step > 0 && (
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)} className="flex items-center gap-1">
                  <ChevronLeft size={14} />
                  {lang === 'tr' ? 'Geri' : 'Back'}
                </Button>
              )}
              <div className="flex-1" />
              {step < 2 ? (
                <Button type="button" onClick={() => canNext() && setStep(step + 1)} className="flex items-center gap-1">
                  {lang === 'tr' ? 'Devam' : 'Continue'}
                  <ChevronRight size={14} />
                </Button>
              ) : (
                <Button type="submit" loading={loading} className="flex items-center gap-2 px-8">
                  {t('save')}
                </Button>
              )}
            </div>
          </div>

          {/* ═══════════ LIVE PREVIEW (Desktop Sidebar) ═══════════ */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-0">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} className="text-[var(--text-secondary)]" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                  {lang === 'tr' ? 'Canlı Önizleme' : 'Live Preview'}
                </span>
              </div>
              <LivePreview data={previewData} lang={lang} />
            </div>
          </div>
        </div>

        {/* ═══════════ LIVE PREVIEW (Mobile Bottom) ═══════════ */}
        <div className="lg:hidden mt-4">
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              <Eye size={12} />
              {lang === 'tr' ? 'Önizlemeyi Gör' : 'Show Preview'}
            </summary>
            <div className="max-w-xs mx-auto">
              <LivePreview data={previewData} lang={lang} />
            </div>
          </details>
        </div>
      </form>
    </Modal>
  );
}
