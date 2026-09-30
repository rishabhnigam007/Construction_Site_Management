import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Check, MapPin, Building, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Site } from '../../types';
import { db } from '../../db';
import { getTodayString } from '../../utils/formatters';

interface SiteSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  activeSiteId: string;
  onSelectSite: (siteId: string) => void;
}

export const SiteSelectorModal: React.FC<SiteSelectorModalProps> = ({
  isOpen,
  onClose,
  sites,
  activeSiteId,
  onSelectSite,
}) => {
  const { t } = useTranslation();
  const [modalMode, setModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setName('');
    setLocation('');
    setClientName('');
    setModalMode('add');
  };

  const handleStartEdit = (site: Site, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSiteId(site.id);
    setName(site.name || '');
    setLocation(site.location || '');
    setClientName(site.clientName || '');
    setModalMode('edit');
  };

  const handleDeleteSite = async (siteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sites.length <= 1) {
      alert('You cannot delete the only existing site. Please add another site first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this site? All related entries will remain in database.')) {
      await db.sites.delete(siteId);
      if (siteId === activeSiteId) {
        const remaining = sites.filter((s) => s.id !== siteId);
        if (remaining[0]) {
          await db.settings.update('global_settings', { activeSiteId: remaining[0].id });
          onSelectSite(remaining[0].id);
        }
      }
    }
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSiteId = `site_${Date.now()}`;
    const newSite: Site = {
      id: newSiteId,
      name: name.trim(),
      location: location.trim() || 'Site Location',
      clientName: clientName.trim(),
      startDate: getTodayString(),
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.sites.add(newSite);
    await db.settings.update('global_settings', { activeSiteId: newSiteId });
    onSelectSite(newSiteId);
    setName('');
    setLocation('');
    setClientName('');
    setModalMode('list');
    onClose();
  };

  const handleUpdateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiteId || !name.trim()) return;

    await db.sites.update(editingSiteId, {
      name: name.trim(),
      location: location.trim(),
      clientName: clientName.trim(),
      updatedAt: Date.now(),
    });

    setEditingSiteId(null);
    setName('');
    setLocation('');
    setClientName('');
    setModalMode('list');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">
              {modalMode === 'add'
                ? t('site.add_new_site')
                : modalMode === 'edit'
                ? 'Edit Site Details'
                : t('site.select_site')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3">
          {modalMode === 'list' && (
            <>
              <div className="space-y-2">
                {sites.map((site) => {
                  const isSelected = site.id === activeSiteId;
                  return (
                    <div
                      key={site.id}
                      onClick={() => {
                        onSelectSite(site.id);
                        onClose();
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-100">{site.name}</span>
                          {isSelected && (
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          {site.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {site.location}
                            </span>
                          )}
                          {site.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {site.startDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Edit Site Button */}
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(site, e)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/80 rounded-lg transition-colors"
                          title="Edit Site Name & Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Site Button */}
                        {sites.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSite(site.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete Site"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {isSelected && <Check className="w-5 h-5 text-emerald-400 ml-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleStartAdd}
                className="w-full mt-2 py-3 px-4 rounded-xl border-2 border-dashed border-emerald-600/50 hover:border-emerald-500 text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-950/20 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                {t('site.add_new_site')}
              </button>
            </>
          )}

          {modalMode === 'add' && (
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.site_name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 37 sector / Galaxy Heights"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.site_location')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 37, Gurgaon"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.client_name')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Builders"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('list')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 font-semibold text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-slate-950 shadow-md transition-all active:scale-98"
                >
                  Create Site
                </button>
              </div>
            </form>
          )}

          {modalMode === 'edit' && (
            <form onSubmit={handleUpdateSite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.site_name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 37 sector / Galaxy Heights"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.site_location')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 37, Gurgaon"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('site.client_name')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Builders"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode('list')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 font-semibold text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-slate-950 shadow-md transition-all active:scale-98"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
