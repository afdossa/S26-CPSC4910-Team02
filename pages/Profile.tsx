
import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile, getUserProfile } from '../services/mockData';
import { User as UserIcon, Mail, Phone, MapPin, Camera, Save, X, Edit3, Loader, RefreshCw, ArrowLeft, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form state
  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [address, setAddress] = useState(user.address || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [bio, setBio] = useState(user.bio || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const updates = {
      fullName,
      phoneNumber,
      address,
      avatarUrl,
      bio
    };

    try {
      const success = await updateUserProfile(user.id, updates);
      if (success) {
        const updatedUser = await getUserProfile(user.id);
        if (updatedUser) {
          onUpdate(updatedUser);
          setMessage({ text: 'Profile updated successfully!', type: 'success' });
          setIsEditing(false);
        }
      } else {
        setMessage({ text: 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'An error occurred while saving.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const randomizeAvatar = () => {
    const newAvatar = `https://picsum.photos/200/200?random=${Date.now()}`;
    setAvatarUrl(newAvatar);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32 md:h-48 relative">
           <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <img 
                  src={avatarUrl || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="h-32 w-32 md:h-40 md:w-40 rounded-2xl object-cover border-4 border-white shadow-lg bg-gray-100"
                />
                {isEditing && (
                  <button 
                    onClick={randomizeAvatar}
                    className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Randomize Photo"
                  >
                    <RefreshCw className="text-white h-8 w-8" />
                  </button>
                )}
              </div>
           </div>
        </div>

        <div className="pt-20 px-8 pb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{user.fullName}</h1>
              <p className="text-gray-500 font-medium">@{user.username} • {user.role}</p>
            </div>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="mt-4 md:mt-0 flex items-center px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
              </button>
            ) : (
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-6 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-500" /> About Me
                </label>
                {isEditing ? (
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-white transition-all resize-none"
                    placeholder="Tell us about yourself, your driving experience, or your goals..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-transparent text-gray-700 prose-sm min-h-[100px]">
                    {bio || <span className="text-gray-400 italic">No description provided yet. Click edit to add an about me section!</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <UserIcon className="w-4 h-4 mr-2 text-blue-500" /> Full Name
                </label>
                <input 
                  type="text" 
                  readOnly={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${
                    isEditing 
                    ? 'border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-white' 
                    : 'border-transparent bg-gray-50 text-gray-600'
                  }`}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" /> Email Address
                </label>
                <input 
                  type="email" 
                  readOnly
                  value={user.email}
                  className="w-full px-4 py-3 rounded-xl border border-transparent bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed (primary ID).</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" /> Phone Number
                </label>
                <input 
                  type="tel" 
                  readOnly={!isEditing}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border transition-all ${
                    isEditing 
                    ? 'border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-white' 
                    : 'border-transparent bg-gray-50 text-gray-600'
                  }`}
                  placeholder="(555) 000-0000"
                />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-blue-500" /> Profile Picture URL
                  </label>
                  <input 
                    type="url" 
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-white"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-blue-500" /> Address
                </label>
                <textarea 
                  readOnly={!isEditing}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                    isEditing 
                    ? 'border-blue-200 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 bg-white' 
                    : 'border-transparent bg-gray-50 text-gray-600'
                  }`}
                  placeholder="123 Road Ave, City, State"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
