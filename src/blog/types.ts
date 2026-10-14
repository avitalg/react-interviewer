export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  relatedExercises: string[];
  body: string;
  faq?: ArticleFaq[];
}
