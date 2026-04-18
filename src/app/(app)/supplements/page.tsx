'use client';

import { useAuthStore } from '@/stores';
import { useProtocol, useSupplementLog, useToggleSupplement } from '@/controllers';
import { today } from '@/lib/utils';
import { Pill, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupplementsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: protocol } = useProtocol(userId);
  const { data: log } = useSupplementLog(userId, todayStr);
  const toggle = useToggleSupplement(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Supplements</h1>
        <p className="text-text-secondary">Track your daily supplement protocol</p>
      </div>

      <div className="space-y-4">
        {protocol?.windows.map((window) => {
          const windowLog = log?.windows?.[window.timing] || {};
          const allChecked = window.supplements.every((s) => windowLog[s]);

          return (
            <div key={window.timing} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    allChecked ? 'bg-success/10' : 'bg-accent/10'
                  )}
                >
                  <Pill
                    className={cn(allChecked ? 'text-success' : 'text-accent')}
                    size={20}
                  />
                </div>
                <div>
                  <h2 className="font-medium text-foreground capitalize">{window.timing}</h2>
                  {window.time && (
                    <p className="text-sm text-text-secondary">{window.time}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {window.supplements.map((supplement) => {
                  const isChecked = windowLog[supplement] || false;

                  return (
                    <button
                      key={supplement}
                      onClick={() =>
                        toggle.mutate({ date: todayStr, window: window.timing, supplement })
                      }
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                        isChecked
                          ? 'bg-success/10 border border-success/20'
                          : 'bg-surface-elevated border border-border hover:bg-border'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm',
                          isChecked ? 'text-success' : 'text-foreground'
                        )}
                      >
                        {supplement}
                      </span>
                      {isChecked && <Check size={16} className="text-success" />}
                    </button>
                  );
                })}

                {window.optional?.map((supplement) => {
                  const isChecked = windowLog[supplement] || false;

                  return (
                    <button
                      key={supplement}
                      onClick={() =>
                        toggle.mutate({ date: todayStr, window: window.timing, supplement })
                      }
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                        isChecked
                          ? 'bg-accent/10 border border-accent/20'
                          : 'bg-surface-elevated/50 border border-border/50 hover:bg-border/50'
                      )}
                    >
                      <span className="text-sm text-text-secondary">
                        {supplement} (optional)
                      </span>
                      {isChecked && <Check size={16} className="text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {protocol?.notes && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="font-medium text-foreground mb-2">Notes</h3>
          <ul className="list-disc list-inside text-sm text-text-secondary space-y-1">
            {protocol.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
