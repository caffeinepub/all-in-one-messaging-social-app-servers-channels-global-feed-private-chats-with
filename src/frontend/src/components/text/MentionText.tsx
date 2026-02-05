import { useState } from 'react';
import { useMentionResolver } from '../../hooks/useMentionResolver';
import ProfilePopover from '../profile/ProfilePopover';

interface MentionTextProps {
  content: string;
}

interface MentionMatch {
  text: string;
  displayName: string;
  start: number;
  end: number;
}

function parseMentions(text: string): MentionMatch[] {
  const mentionRegex = /@(\w+)/g;
  const matches: MentionMatch[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      displayName: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

function MentionLink({ displayName }: { displayName: string }) {
  const { data: principal } = useMentionResolver(displayName);

  if (!principal) {
    return <span className="text-primary font-medium">@{displayName}</span>;
  }

  return (
    <ProfilePopover userPrincipal={principal} displayName={displayName}>
      <button className="text-primary font-medium hover:underline">
        @{displayName}
      </button>
    </ProfilePopover>
  );
}

export default function MentionText({ content }: MentionTextProps) {
  const mentions = parseMentions(content);

  if (mentions.length === 0) {
    return <>{content}</>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  mentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.start > lastIndex) {
      parts.push(content.substring(lastIndex, mention.start));
    }

    // Add mention component
    parts.push(
      <MentionLink key={`mention-${index}`} displayName={mention.displayName} />
    );

    lastIndex = mention.end;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <>{parts}</>;
}
