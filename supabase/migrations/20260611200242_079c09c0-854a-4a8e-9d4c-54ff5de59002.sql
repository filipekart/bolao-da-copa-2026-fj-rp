ALTER VIEW public.v_extra_predictions_stats SET (security_invoker = false);
GRANT SELECT ON public.v_extra_predictions_stats TO authenticated;