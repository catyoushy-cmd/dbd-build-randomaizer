import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ArticleForm } from './ArticleForm';

type Props = { params: { id: string } };

export default async function ArticleEditPage({ params }: Props) {
  const isNew = params.id === 'new';

  let article: Record<string, unknown> | null = null;
  if (!isNew) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('wiki_articles')
      .select('*')
      .eq('id', params.id)
      .single();
    if (!data) notFound();
    article = data as Record<string, unknown>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[800px]">
      <div>
        <span className="label-mono text-[10px] text-ink-mute">
          {isNew ? 'Создать' : 'Редактировать'}
        </span>
        <h1 className="mt-1 text-[22px] font-extrabold text-dbd-bone">
          {isNew ? 'Новая статья' : (article?.title as string)}
        </h1>
      </div>

      <ArticleForm article={article} isNew={isNew} />
    </div>
  );
}
