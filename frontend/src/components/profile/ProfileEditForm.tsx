import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { User } from '../../types';

interface ProfileEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (updates: Partial<User>) => Promise<void>;
}

export default function ProfileEditForm({ isOpen, onClose, user, onSubmit }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location);
  const [phone, setPhone] = useState(user.phone);
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [bio, setBio] = useState(user.bio || '');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Compress image to max 300x300, JPEG 0.7 quality
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 300;
      let w = img.width, h = img.height;
      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      setProfileImage(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, location, phone, profileImage, bio });
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('editProfile')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-[var(--bg-input)] overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-semibold text-[#6B6560]">
                  {name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#2D6A4F] text-white rounded-full flex items-center justify-center">
              <Camera size={14} />
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        <Input label={t('name')} value={name} onChange={e => setName(e.target.value)} required />
        <Input label={t('location')} value={location} onChange={e => setLocation(e.target.value)} />
        <Input label={t('listing.phone')} value={phone} onChange={e => setPhone(e.target.value)} />

        <div>
          <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">{t('profileInfo.bio')}</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 300))}
            placeholder={t('profileInfo.bioPlaceholder')}
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
          <p className="text-[10px] text-[#6B6560] text-right mt-1">{bio.length}/300</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">{t('cancel')}</Button>
          <Button type="submit" loading={loading} className="flex-1">{t('save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
