import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Plus, Loader2, Pencil, Trash } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { useServiceCatalogItems, useDeleteServiceCatalogItem } from '@/api/hooks/useServiceCatalog'

export function ServiceCatalogAdmin() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const { data, isLoading } = useServiceCatalogItems({ page, page_size: pageSize })
  const deleteMutation = useDeleteServiceCatalogItem()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" /> Catalog Admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage curated automations exposed in the Self-Service Portal.
          </p>
        </div>
        <Link to="/service_catalog/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> New Catalog Item
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No catalog items.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3">Enabled</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3 text-muted-foreground">{item.category || '—'}</td>
                    <td className="p-3">
                      <Badge variant="outline">
                        {item.is_workflow ? 'Workflow' : 'Job Template'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {item.requires_approval ? (
                        <Badge>Required</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/service_catalog/${item.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) {
                              deleteMutation.mutate(item.id)
                            }
                          }}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {data && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalCount={data.count}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPage(1)
          }}
        />
      )}
    </div>
  )
}
