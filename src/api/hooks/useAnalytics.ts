import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  AnalyticsJobTrend,
  AnalyticsSuccessRate,
  AnalyticsTopTemplate,
  AnalyticsBusiestHost,
  AnalyticsHostCoverage,
  AnalyticsFailureAnalysis,
  AnalyticsTimeSavings,
} from '@/api/types'

export function useJobTrends(period = 'month') {
  return useQuery<AnalyticsJobTrend[]>({
    queryKey: ['analytics', 'job_trends', period],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsJobTrend[]>(
        '/forail_analytics/job_trends/',
        { params: { period } },
      )
      return data
    },
  })
}

export function useSuccessRate(period = 'month') {
  return useQuery<AnalyticsSuccessRate[]>({
    queryKey: ['analytics', 'success_rate', period],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsSuccessRate[]>(
        '/forail_analytics/success_rate/',
        { params: { period } },
      )
      return data
    },
  })
}

export function useTopTemplates(period = 'month', limit = 10) {
  return useQuery<AnalyticsTopTemplate[]>({
    queryKey: ['analytics', 'top_templates', period, limit],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsTopTemplate[]>(
        '/forail_analytics/top_templates/',
        { params: { period, limit } },
      )
      return data
    },
  })
}

export function useBusiestHosts(period = 'month', limit = 10) {
  return useQuery<AnalyticsBusiestHost[]>({
    queryKey: ['analytics', 'busiest_hosts', period, limit],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsBusiestHost[]>(
        '/forail_analytics/busiest_hosts/',
        { params: { period, limit } },
      )
      return data
    },
  })
}

export function useHostCoverage(period = 'month') {
  return useQuery<AnalyticsHostCoverage>({
    queryKey: ['analytics', 'host_coverage', period],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsHostCoverage>(
        '/forail_analytics/host_coverage/',
        { params: { period } },
      )
      return data
    },
  })
}

export function useFailureAnalysis(period = 'month') {
  return useQuery<AnalyticsFailureAnalysis>({
    queryKey: ['analytics', 'failure_analysis', period],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsFailureAnalysis>(
        '/forail_analytics/failure_analysis/',
        { params: { period } },
      )
      return data
    },
  })
}

export function useTimeSavings(period = 'month', manualMultiplier = 10) {
  return useQuery<AnalyticsTimeSavings>({
    queryKey: ['analytics', 'time_savings', period, manualMultiplier],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsTimeSavings>(
        '/forail_analytics/time_savings/',
        { params: { period, manual_multiplier: manualMultiplier } },
      )
      return data
    },
  })
}
