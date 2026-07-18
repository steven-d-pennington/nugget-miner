import Link from 'next/link';
import { ProvenanceBadge } from '@/features/review/ProvenanceBadge';
import type { ActionItem, Category, GroundedText, Idea, Tag } from '@/types';

function GroundedLine({ value }: { value: GroundedText }) {
  return (
    <li className="idea-summary__line">
      <span>{value.text}</span>
      <ProvenanceBadge basis={value.basis} />
    </li>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="idea-summary__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function IdeaSummaryView({
  idea,
  category,
  tags,
  actions,
  onEdit,
  disabled,
}: {
  idea: Idea;
  category: Category;
  tags: Tag[];
  actions: ActionItem[];
  onEdit(): void;
  disabled: boolean;
}) {
  const isSample = idea.id.startsWith('demo-');
  const why = [idea.purpose, ...idea.goals, idea.problem?.statement]
    .filter((value): value is GroundedText => Boolean(value));
  const obstacles = [...idea.blockers, ...idea.questions, idea.research.assessment]
    .filter((value): value is GroundedText => Boolean(value));

  return (
    <div className="idea-summary">
      <div className="idea-summary__heading">
        <div>
          <p className="idea-summary__category">
            {isSample ? <span className="rounded-full bg-[#FFF2D4] px-2 py-1 text-[#8A5700]">Sample</span> : null}
            <span>{category.name}</span>
          </p>
          <h1>{idea.title}</h1>
        </div>
        <button className="button-quiet" disabled={disabled} onClick={onEdit} type="button">Edit idea</button>
      </div>

      <div className="idea-summary__summary">
        <p>{idea.summary.text}</p>
        <ProvenanceBadge basis={idea.summary.basis} />
      </div>

      {tags.length ? <div aria-label="Tags" className="idea-summary__tags">{tags.map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div> : null}

      {why.length ? (
        <SummarySection title="Why it matters">
          <ul>{why.map((value) => <GroundedLine key={value.id} value={value} />)}</ul>
        </SummarySection>
      ) : null}

      {obstacles.length || idea.research.needed ? (
        <SummarySection title="What's in the way">
          {obstacles.length ? <ul>{obstacles.map((value) => <GroundedLine key={value.id} value={value} />)}</ul> : null}
          {idea.research.suggestedQueries.length ? <p><strong>Suggested searches:</strong> {idea.research.suggestedQueries.join(' · ')}</p> : null}
          {idea.research.suggestedResourceTypes.length ? <p><strong>Resources:</strong> {idea.research.suggestedResourceTypes.join(' · ')}</p> : null}
        </SummarySection>
      ) : null}

      <SummarySection title="Next actions">
        {actions.length ? (
          <ul>{actions.map((action) => <li key={action.id}>{action.status === 'completed' ? '✓' : '○'} {action.text}</li>)}</ul>
        ) : <p>No linked actions yet.</p>}
        <Link href="/actions">Open Actions</Link>
      </SummarySection>
    </div>
  );
}
