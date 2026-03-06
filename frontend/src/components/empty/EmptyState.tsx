import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  imageSrc: string;
  title: string;
  description: string;
}

export default function EmptyState({ imageSrc, title, description }: EmptyStateProps) {
  return (
    <Card className="max-w-2xl mx-auto mt-8 border-dashed">
      <CardContent className="pt-8 pb-8 text-center">
        <img src={imageSrc} alt={title} className="w-full max-w-md mx-auto mb-6 rounded-lg opacity-80" />
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
