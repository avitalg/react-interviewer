export interface ArticleFaq {
  question: string;
  answer: string;
}

export interface Article {
  slug: string;
  title: string;
  /** Page H1 when it should differ from the title tag. */
  headline?: string;
  description: string;
  date: string;
  tags: string[];
  relatedExercises: string[];
  body: string;
  faq?: ArticleFaq[];
}
