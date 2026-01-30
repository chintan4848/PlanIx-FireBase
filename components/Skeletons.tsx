import React from 'react';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer-fast pointer-events-none" />
);

export const BoardSkeleton = () => (
  <div className="flex gap-6 md:gap-8 h-full overflow-x-auto scrollbar-hide pb-8">
    {[1, 2, 3, 4].map((col) => (
      <div key={col} className="flex-1 min-w-[280px] md:min-w-[320px] flex flex-col rounded-t-[2rem] bg-slate-100/30 dark:bg-slate-900/20 p-4 md:p-5 border-t border-x border-slate-200/40 dark:border-slate-800/40 h-full">
        <div className="flex justify-between items-center mb-8 px-1">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden"><Shimmer /></div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg relative overflow-hidden"><Shimmer /></div>
        </div>
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((card) => (
            <div key={card} className="bg-white dark:bg-slate-900/50 rounded-[1.75rem] p-5 border border-slate-200/50 dark:border-slate-800/50 space-y-4 shadow-sm relative overflow-hidden">
              <Shimmer />
              <div className="flex justify-between">
                <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-4 w-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    <div className="h-2 w-10 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-full self-center" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="space-y-10 animate-pulse pb-16">
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 h-[280px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="h-[280px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 h-[400px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="lg:col-span-4 h-[400px] bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="w-full relative min-h-full">
    <div className="h-[180px] bg-slate-900 relative overflow-hidden border-b border-white/5">
      <Shimmer />
      <div className="absolute bottom-8 left-10 flex items-center gap-6">
        <div className="w-24 h-24 rounded-[2rem] bg-slate-800 border-4 border-slate-900" />
        <div className="space-y-3">
          <div className="h-10 w-48 bg-slate-800 rounded-xl" />
          <div className="h-4 w-32 bg-slate-800 rounded-full opacity-50" />
        </div>
      </div>
    </div>
    <div className="max-w-[1920px] mx-auto px-10 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-3 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <Shimmer />
          </div>
        ))}
      </div>
      <div className="lg:col-span-9">
        <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 border border-slate-200 dark:border-slate-800 h-[600px] relative overflow-hidden">
          <Shimmer />
        </div>
      </div>
    </div>
  </div>
);

export const AdminSkeleton = () => (
  <div className="w-full pt-2 pb-8 space-y-12">
    <div className="flex justify-between items-end pb-8 border-b border-slate-200 dark:border-slate-800">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-14 w-48 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
    </div>
    <div className="grid grid-cols-4 gap-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-44 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <Shimmer />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-12 gap-10">
      <div className="col-span-8 h-[600px] bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <Shimmer />
      </div>
      <div className="col-span-4 h-[600px] bg-slate-950 rounded-[4rem] relative overflow-hidden">
        <Shimmer />
      </div>
    </div>
  </div>
);
