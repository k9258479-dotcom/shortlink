/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { MetricCards } from './components/MetricCards.js';
import { LinksTable } from './components/LinksTable.js';
import { CreateLinkModal } from './components/CreateLinkModal.js';
import { EditUrlModal } from './components/EditUrlModal.js';
import { LogsTable } from './components/LogsTable.js';
import { CrawlerSimulator } from './components/CrawlerSimulator.js';
import { CompliancePreviewModal } from './components/CompliancePreviewModal.js';
import { VercelExportHub } from './components/VercelExportHub.js';
import { SettingsModal } from './components/SettingsModal.js';
import { AuthModal } from './components/AuthModal.js';
import { ShortLink, VisitLog } from './types/index.js';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cloakflow_auth') === 'true';
  });
  const [adminToken, setAdminToken] = useState<string>(() => {
    return localStorage.getItem('cloakflow_token') || 'admin123';
  });

  const [activeTab, setActiveTab] = useState<'links' | 'logs' | 'simulator' | 'export' | 'settings'>('links');
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [logs, setLogs] = useState<VisitLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [baseUrl, setBaseUrl] = useState<string>(window.location.origin);
  const [storageStatus, setStorageStatus] = useState<{
    connected: boolean;
    provider: 'upstash' | 'local_kv';
    latencyMs?: number;
    error?: string;
  }>({
    connected: true,
    provider: 'local_kv',
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [quickEditLink, setQuickEditLink] = useState<ShortLink | null>(null);
  const [previewLink, setPreviewLink] = useState<ShortLink | null>(null);
  const [simulatorSlug, setSimulatorSlug] = useState<string>('offer1');

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [linksRes, logsRes, statusRes] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/logs?limit=150'),
        fetch('/api/status'),
      ]);

      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinks(linksData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStorageStatus(statusData.storage || { connected: true, provider: 'local_kv' });
        if (statusData.baseUrl) {
          setBaseUrl(statusData.baseUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      // Background interval to keep real-time logs updated
      const interval = setInterval(fetchData, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  const handleAuthenticate = (token: string): boolean => {
    if (token === adminToken || token === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('cloakflow_auth', 'true');
      localStorage.setItem('cloakflow_token', token);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cloakflow_auth');
  };

  const handleSaveLink = async (linkData: Partial<ShortLink>) => {
    const isUpdate = !!editingLink;
    const url = isUpdate ? `/api/links/${linkData.slug}` : '/api/links';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save link');
    }

    setEditingLink(null);
    await fetchData();
  };

  const handleQuickSaveUrl = async (slug: string, newUrl: string) => {
    const res = await fetch(`/api/links/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationUrl: newUrl }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update destination');
    }

    setQuickEditLink(null);
    await fetchData();
  };

  const handleDeleteLink = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete /l/${slug}?`)) return;

    await fetch(`/api/links/${slug}`, { method: 'DELETE' });
    await fetchData();
  };

  const handleToggleActive = async (link: ShortLink) => {
    await fetch(`/api/links/${link.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    await fetchData();
  };

  const handleClearLogs = async () => {
    if (!confirm('Clear all recorded visit logs?')) return;
    await fetch('/api/logs', { method: 'DELETE' });
    await fetchData();
  };

  const handleUpdateUpstash = async (url: string, token: string) => {
    const res = await fetch('/api/config/upstash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, token }),
    });
    const data = await res.json();
    setStorageStatus(data);
    await fetchData();
    return data;
  };

  const handleUpdateAdminToken = (newToken: string) => {
    setAdminToken(newToken);
    localStorage.setItem('cloakflow_token', newToken);
  };

  const openSimulatorForSlug = (slug: string) => {
    setSimulatorSlug(slug);
    setActiveTab('simulator');
  };

  if (!isAuthenticated) {
    return (
      <AuthModal
        onAuthenticate={handleAuthenticate}
        configuredToken={adminToken}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        storageStatus={storageStatus}
        onRefresh={fetchData}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
        onOpenCreate={() => {
          setEditingLink(null);
          setIsCreateOpen(true);
        }}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'links' && (
          <>
            {/* Quantitative High-Density Metrics */}
            <MetricCards links={links} />

            {/* Links Table */}
            <LinksTable
              links={links}
              baseUrl={baseUrl}
              onEditUrl={(link) => setQuickEditLink(link)}
              onEditFull={(link) => {
                setEditingLink(link);
                setIsCreateOpen(true);
              }}
              onDelete={handleDeleteLink}
              onPreviewCompliance={(link) => setPreviewLink(link)}
              onTestCrawler={openSimulatorForSlug}
              onToggleActive={handleToggleActive}
            />

            {/* Recent Live Stream Snippet */}
            <LogsTable
              logs={logs.slice(0, 8)}
              onClearLogs={handleClearLogs}
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
          </>
        )}

        {activeTab === 'logs' && (
          <LogsTable
            logs={logs}
            onClearLogs={handleClearLogs}
            onRefresh={fetchData}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'simulator' && (
          <CrawlerSimulator
            links={links}
            baseUrl={baseUrl}
            initialSlug={simulatorSlug}
            onOpenCompliancePreview={(link) => setPreviewLink(link)}
          />
        )}

        {activeTab === 'export' && <VercelExportHub />}

        {activeTab === 'settings' && (
          <SettingsModal
            storageStatus={storageStatus}
            onUpdateUpstash={handleUpdateUpstash}
            currentAdminToken={adminToken}
            onUpdateAdminToken={handleUpdateAdminToken}
          />
        )}
      </main>

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        editLink={editingLink}
      />

      <EditUrlModal
        isOpen={!!quickEditLink}
        link={quickEditLink}
        onClose={() => setQuickEditLink(null)}
        onSave={handleQuickSaveUrl}
      />

      <CompliancePreviewModal
        isOpen={!!previewLink}
        link={previewLink}
        onClose={() => setPreviewLink(null)}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 px-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>CloakFlow Edge Engine</span>
            <span>&bull;</span>
            <span>Meta Web Crawler Interception</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button onClick={() => setActiveTab('export')} className="hover:underline">
              Vercel Deployment Kit
            </button>
            <a
              href="https://developers.facebook.com/tools/debug/"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Facebook Sharing Debugger
            </a>
            <a
              href="https://console.upstash.com"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Upstash Redis Console
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
