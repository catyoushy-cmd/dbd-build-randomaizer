import { fetchAllContent, fetchStatusEffects } from '@/lib/data/content-db';
import { SearchClient } from './SearchClient';

export const revalidate = 600;

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const [content, statusEffects] = await Promise.all([
    fetchAllContent(),
    fetchStatusEffects(),
  ]);

  return (
    <div className="mx-auto max-w-[920px] px-5 sm:px-10 pt-10 sm:pt-12 pb-16">
      <div className="mb-8">
        <span className="label-mono text-[11px] text-ink-mute">Поиск</span>
        <h1 className="mt-2 text-[28px] font-extrabold text-dbd-bone">Найти всё</h1>
        <p className="mt-2 font-sans text-[14px] text-ink-mute max-w-[600px]">
          Один запрос ищет по перкам, аддонам, подношениям, предметам, персонажам и состояниям.
        </p>
      </div>

      <SearchClient
        perks={content.perks}
        killers={content.killers}
        survivors={content.survivors}
        items={content.items}
        addons={content.addons}
        offerings={content.offerings}
        statusEffects={statusEffects}
        initialQuery={searchParams.q ?? ''}
      />
    </div>
  );
}
