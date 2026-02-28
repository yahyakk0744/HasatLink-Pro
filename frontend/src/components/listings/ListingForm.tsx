import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  CATEGORIES, CATEGORY_LABELS,
  PAZAR_UNITS, QUALITY_GRADES, STORAGE_TYPES,
  VEHICLE_TYPES,
  WORKER_SKILLS,
  EQUIPMENT_CONDITIONS, EQUIPMENT_BRANDS, SALE_TYPES, RENT_TYPES,
  LISTING_MODE_LABELS,
  SOIL_TYPES, LAND_UNITS, DEED_STATUSES, ZONING_STATUSES, RENT_DURATIONS_ARAZI,
  STORAGE_CAPACITY_UNITS, RENT_DURATIONS_DEPO,
} from '../../utils/constants';
import type { Listing } from '../../types';

interface ListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Listing>) => Promise<void>;
  initialData?: Partial<Listing>;
}

function SelectButtons({ options, value, onChange, color = '#2D6A4F' }: { options: readonly string[] | string[]; value: string; onChange: (v: string) => void; color?: string }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1.5 text-[10px] font-medium uppercase rounded-full transition-all"
          style={value === opt ? { background: color, color: '#fff' } : { background: '#F5F3EF', color: '#6B6560' }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-[#2D6A4F]" />
      <span className="text-xs font-medium uppercase">{label}</span>
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
          style={values.includes(opt) ? { background: color, color: '#fff' } : { background: '#F5F3EF', color: '#6B6560' }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1">
      <div className="h-px flex-1 bg-[#EBE7E0]" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6560]">{children}</span>
      <div className="h-px flex-1 bg-[#EBE7E0]" />
    </div>
  );
}

export default function ListingForm({ isOpen, onClose, onSubmit, initialData }: ListingFormProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const [loading, setLoading] = useState(false);

  // Common
  const [type, setType] = useState(initialData?.type || 'pazar');
  const [listingMode, setListingMode] = useState<'sell' | 'buy'>(initialData?.listingMode || 'sell');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || 'kg');
  const [location, setLocation] = useState(initialData?.location || 'Ceyhan, Adana');
  const [phone, setPhone] = useState(initialData?.phone || '');
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

  // İşgücü
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
  const [landUnit, setLandUnit] = useState(initialData?.landUnit || 'dönüm');
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

  const subCategories = CATEGORIES[type as keyof typeof CATEGORIES]?.filter(c => c !== 'HEPSİ') || [];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: Partial<Listing> = {
        type: type as Listing['type'],
        listingMode,
        subCategory, title, description,
        price: parseFloat(price) || 0,
        amount: parseFloat(amount) || 0,
        unit, location, phone, images,
      };

      if (type === 'pazar') {
        data.harvestDate = harvestDate;
        data.isOrganic = isOrganic;
        data.qualityGrade = qualityGrade;
        data.storageType = storageType;
        data.minOrderAmount = parseFloat(minOrderAmount) || 0;
      } else if (type === 'lojistik') {
        data.isFrigo = isFrigo;
        data.vehicleType = vehicleType;
        data.capacity = parseFloat(capacity) || 0;
        data.routeFrom = routeFrom;
        data.routeTo = routeTo;
        data.availableDate = availableDate;
        data.hasInsurance = hasInsurance;
        data.plateNumber = plateNumber;
      } else if (type === 'isgucu') {
        data.isTeam = isTeam;
        data.workerCount = parseInt(workerCount) || 1;
        data.experienceYears = parseInt(experienceYears) || 0;
        data.dailyWage = parseFloat(dailyWage) || 0;
        data.skills = skills;
      } else if (type === 'ekipman') {
        data.rentType = rentType;
        data.brand = brand;
        data.modelName = modelName;
        data.yearOfManufacture = parseInt(yearOfManufacture) || 0;
        data.condition = condition;
        data.horsePower = parseInt(horsePower) || 0;
        data.saleType = saleType;
      } else if (type === 'arazi') {
        data.landSize = parseFloat(landSize) || 0;
        data.landUnit = landUnit;
        data.soilType = soilType;
        data.waterAvailable = waterAvailable;
        data.hasElectricity = hasElectricity;
        data.deedStatus = deedStatus;
        data.zoningStatus = zoningStatus;
        data.rentDuration = rentDuration;
      } else if (type === 'depolama') {
        data.storageCapacity = parseFloat(storageCapacity) || 0;
        data.storageCapacityUnit = storageCapacityUnit;
        data.temperatureMin = parseFloat(temperatureMin) || 0;
        data.temperatureMax = parseFloat(temperatureMax) || 0;
        data.hasSecurity = hasSecurity;
        data.has24Access = has24Access;
        data.rentDuration = rentDuration;
      }

      await onSubmit(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('edit') : t('listing.create')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Type Selection */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-2">{t('listing.type')}</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(CATEGORY_LABELS).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setType(key as typeof type); setSubCategory(''); }}
                className={`px-4 py-2 text-xs font-semibold uppercase rounded-full transition-all ${
                  type === key ? 'bg-[#1A1A1A] text-white' : 'bg-[#F5F3EF] text-[#6B6560]'
                }`}
              >
                {cat.icon} {cat.tr}
              </button>
            ))}
          </div>
        </div>

        {/* Listing Mode: Sell / Buy */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-2">{t('listing.listingMode')}</label>
          <div className="flex gap-2">
            {(['sell', 'buy'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setListingMode(mode)}
                className={`flex-1 px-4 py-2.5 text-xs font-semibold uppercase rounded-full transition-all ${
                  listingMode === mode
                    ? mode === 'sell' ? 'bg-[#2D6A4F] text-white' : 'bg-[#0077B6] text-white'
                    : 'bg-[#F5F3EF] text-[#6B6560]'
                }`}
              >
                {LISTING_MODE_LABELS[type]?.[mode]?.[lang] || (mode === 'sell' ? t('listing.modeSell') : t('listing.modeBuy'))}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-2">{t('listing.subCategory')}</label>
          <div className="flex gap-2 flex-wrap">
            {subCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSubCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-medium uppercase rounded-full transition-all ${
                  subCategory === cat ? 'bg-[#2D6A4F] text-white' : 'bg-[#F5F3EF] text-[#6B6560]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Input label={t('listing.title')} value={title} onChange={e => setTitle(e.target.value)} required />

        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.description')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-[#F5F3EF] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* === PAZAR SPECIFIC === */}
        {type === 'pazar' && (
          <>
            <SectionTitle>{t('listing.pazarDetails')}</SectionTitle>

            <div className="grid grid-cols-3 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺/birim)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              <Input label={t('listing.amount')} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.unit')}</label>
                <SelectButtons options={PAZAR_UNITS} value={unit} onChange={setUnit} />
              </div>
            </div>

            <Input label={t('listing.minOrder')} type="number" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} />

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">
                {listingMode === 'buy' ? t('listing.minQualityWanted') : t('listing.quality')}
              </label>
              <SelectButtons options={QUALITY_GRADES} value={qualityGrade} onChange={setQualityGrade} />
            </div>

            {listingMode === 'sell' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.storage')}</label>
                <SelectButtons options={STORAGE_TYPES} value={storageType} onChange={setStorageType} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label={listingMode === 'buy' ? t('listing.deliveryDateNeeded') : t('listing.harvestDate')} type="date" value={harvestDate} onChange={e => setHarvestDate(e.target.value)} />
              <div className="flex items-end pb-1">
                <CheckboxField label={t('listing.organic')} checked={isOrganic} onChange={setIsOrganic} />
              </div>
            </div>
          </>
        )}

        {/* === LOJİSTİK SPECIFIC === */}
        {type === 'lojistik' && (
          <>
            <SectionTitle>{t('listing.lojistikDetails')}</SectionTitle>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">
                {listingMode === 'buy' ? t('listing.neededVehicleType') : t('listing.vehicleType')}
              </label>
              <SelectButtons options={VEHICLE_TYPES} value={vehicleType} onChange={setVehicleType} color="#0077B6" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
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

            <div className="flex items-center gap-6">
              <CheckboxField label={t('listing.frigo')} checked={isFrigo} onChange={setIsFrigo} />
              <CheckboxField label={t('listing.insurance')} checked={hasInsurance} onChange={setHasInsurance} />
            </div>
          </>
        )}

        {/* === İŞGÜCÜ SPECIFIC === */}
        {type === 'isgucu' && (
          <>
            <SectionTitle>{t('listing.isgucuDetails')}</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.offeredWage') : t('listing.dailyWage')) + ' (₺)'} type="number" value={dailyWage} onChange={e => setDailyWage(e.target.value)} />
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺ toplam)'} type="number" value={price} onChange={e => setPrice(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label={listingMode === 'buy' ? t('listing.neededWorkers') : t('listing.workerCount')} type="number" value={workerCount} onChange={e => setWorkerCount(e.target.value)} />
              <Input label={t('listing.experience')} type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
            </div>

            <CheckboxField label={t('listing.team')} checked={isTeam} onChange={setIsTeam} />

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">
                {listingMode === 'buy' ? t('listing.requiredSkills') : t('listing.skills')}
              </label>
              <MultiSelectButtons options={WORKER_SKILLS} values={skills} onChange={setSkills} color="#A47148" />
            </div>
          </>
        )}

        {/* === EKİPMAN SPECIFIC === */}
        {type === 'ekipman' && (
          <>
            <SectionTitle>{t('listing.ekipmanDetails')}</SectionTitle>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.saleType')}</label>
              <SelectButtons options={SALE_TYPES} value={saleType} onChange={setSaleType} color="#A47148" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              {saleType !== 'SATILIK' && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.rentType')}</label>
                  <SelectButtons options={RENT_TYPES} value={rentType} onChange={setRentType} color="#A47148" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">
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
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">
                {listingMode === 'buy' ? t('listing.minCondition') : t('listing.condition')}
              </label>
              <SelectButtons options={EQUIPMENT_CONDITIONS} value={condition} onChange={setCondition} />
            </div>
          </>
        )}

        {/* === ARAZİ SPECIFIC === */}
        {type === 'arazi' && (
          <>
            <SectionTitle>{t('listing.araziDetails')}</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('listing.landSize')} type="number" value={landSize} onChange={e => setLandSize(e.target.value)} />
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.landUnit')}</label>
                  <SelectButtons options={LAND_UNITS} value={landUnit} onChange={setLandUnit} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.soilType')}</label>
              <SelectButtons options={SOIL_TYPES} value={soilType} onChange={setSoilType} color="#A47148" />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.deedStatus')}</label>
              <SelectButtons options={DEED_STATUSES} value={deedStatus} onChange={setDeedStatus} />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.zoningStatus')}</label>
              <SelectButtons options={ZONING_STATUSES} value={zoningStatus} onChange={setZoningStatus} />
            </div>

            {listingMode === 'buy' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.rentDuration')}</label>
                <SelectButtons options={RENT_DURATIONS_ARAZI} value={rentDuration} onChange={setRentDuration} color="#0077B6" />
              </div>
            )}

            <div className="flex items-center gap-6">
              <CheckboxField label={t('listing.waterAvailable')} checked={waterAvailable} onChange={setWaterAvailable} />
              <CheckboxField label={t('listing.hasElectricity')} checked={hasElectricity} onChange={setHasElectricity} />
            </div>
          </>
        )}

        {/* === DEPOLAMA SPECIFIC === */}
        {type === 'depolama' && (
          <>
            <SectionTitle>{t('listing.depolamaDetails')}</SectionTitle>

            <div className="grid grid-cols-2 gap-3">
              <Input label={(listingMode === 'buy' ? t('listing.priceBudget') : t('listing.price')) + ' (₺)'} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('listing.storageCapacity')} type="number" value={storageCapacity} onChange={e => setStorageCapacity(e.target.value)} />
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.capacityUnit')}</label>
                  <SelectButtons options={STORAGE_CAPACITY_UNITS} value={storageCapacityUnit} onChange={setStorageCapacityUnit} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label={t('listing.temperatureMin') + ' (°C)'} type="number" value={temperatureMin} onChange={e => setTemperatureMin(e.target.value)} />
              <Input label={t('listing.temperatureMax') + ' (°C)'} type="number" value={temperatureMax} onChange={e => setTemperatureMax(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-1.5">{t('listing.rentDuration')}</label>
              <SelectButtons options={RENT_DURATIONS_DEPO} value={rentDuration} onChange={setRentDuration} color="#0077B6" />
            </div>

            <div className="flex items-center gap-6">
              <CheckboxField label={t('listing.hasSecurity')} checked={hasSecurity} onChange={setHasSecurity} />
              <CheckboxField label={t('listing.has24Access')} checked={has24Access} onChange={setHas24Access} />
            </div>
          </>
        )}

        {/* Common: Location & Phone */}
        <SectionTitle>{t('listing.contactInfo')}</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('listing.location')} value={location} onChange={e => setLocation(e.target.value)} />
          <Input label={t('listing.phone')} value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Pazar specific: price already handled above, others need generic price if not shown */}
        {type !== 'pazar' && type !== 'lojistik' && type !== 'isgucu' && type !== 'ekipman' && type !== 'arazi' && type !== 'depolama' && (
          <div className="grid grid-cols-3 gap-3">
            <Input label={t('listing.price')} type="number" value={price} onChange={e => setPrice(e.target.value)} required />
            <Input label={t('listing.amount')} type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <Input label={t('listing.unit')} value={unit} onChange={e => setUnit(e.target.value)} />
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560] mb-2">{t('listing.images')}</label>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label className="w-20 h-20 border-2 border-dashed border-[#D6D0C8] rounded-xl flex items-center justify-center cursor-pointer hover:border-[#2D6A4F] transition-colors">
              <ImagePlus size={20} className="text-[#6B6560]" />
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">{t('cancel')}</Button>
          <Button type="submit" loading={loading} className="flex-1">{t('save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
