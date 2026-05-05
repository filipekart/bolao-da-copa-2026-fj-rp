ALTER TABLE public.extra_predictions DROP CONSTRAINT IF EXISTS extra_predictions_category_check;
ALTER TABLE public.extra_predictions ADD CONSTRAINT extra_predictions_category_check
  CHECK (category IN ('top_scorer', 'mvp', 'champion', 'top_scorer_result', 'mvp_result'));