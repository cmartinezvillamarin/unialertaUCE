import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Plus,
  Navigation,
  FolderTree,
  Users,
  Tags,
  MessageSquare,
  Bell,
  Share2,
  Eye,
  Settings,
  Shield,
  Locate,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAnimations, transitionClasses, hoverClasses } from "@/hooks/optimizacion";
import { useMenuVisibility, type MenuItem } from "@/hooks/controlador/useMenuVisibility";
import { useUserDataReady, usePendingFriendRequests } from "@/hooks/entidades";
import { useUnreadCount } from "@/contexts/NotificationsContext";
import { UserMenu } from "@/components/UserMenu";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['user_role'];
type UserPermission = Database['public']['Enums']['user_permission'];

interface SidebarMenuItem extends MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  permissions?: UserPermission[];
}

const menuItems: SidebarMenuItem[] = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard,
    roles: ['super_admin', 'administrador', 'mantenimiento', 'operador_analista', 'seguridad_uce']
  },
  { 
    title: "Reportes", 
    url: "/reportes", 
    icon: FileText,
    permissions: ['ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte']
  },
  { 
    title: "Mis Reportes", 
    url: "/mis-reportes", 
    icon: ClipboardList,
    permissions: ['ver_reporte', 'crear_reporte', 'editar_reporte', 'eliminar_reporte']
  },
  { 
    title: "Crear Reporte", 
    url: "/crear-reporte", 
    icon: Plus,
    permissions: ['crear_reporte']
  },
  { 
    title: "Mapa de calor", 
    url: "/rastreo", 
    icon: Navigation 
  },
  {
    title: "GeoTracking",
    url: "/geotracking",
    icon: Locate
  },
  { 
    title: "Tipo de Reportes",
    url: "/tipo-reportes", 
    icon: FolderTree,
    permissions: ['ver_estado', 'crear_estado', 'editar_estado', 'eliminar_estado'],
    roles: ['mantenimiento', 'operador_analista']
  },
  { 
    title: "Usuarios", 
    url: "/usuarios", 
    icon: Users,
    permissions: ['ver_usuario', 'crear_usuario', 'editar_usuario', 'eliminar_usuario'],
    roles: ['super_admin', 'administrador']
  },
  { 
    title: "Categorías", 
    url: "/categorias", 
    icon: Tags,
    permissions: ['ver_categoria', 'crear_categoria', 'editar_categoria', 'eliminar_categoria'],
    roles: ['mantenimiento', 'operador_analista']
  },
  { 
    title: "Mensajes", 
    url: "/mensajes", 
    icon: MessageSquare 
  },
  { 
    title: "Notificaciones", 
    url: "/notificaciones", 
    icon: Bell
  },
  { 
    title: "Red Social", 
    url: "/red-social", 
    icon: Share2 
  },
  { 
    title: "Auditoría", 
    url: "/auditoria", 
    icon: Eye,
    roles: ['super_admin', 'administrador']
  },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { getStaggerClass } = useAnimations();
  
  // Obtener datos del usuario desde el caché de React Query
  const { profile, userRoles } = useUserDataReady();
  
  // Obtener conteo de notificaciones desde el contexto global
  const notificationCount = useUnreadCount();
  
  // Obtener solicitudes de amistad pendientes
  const { pendingRequests, count: friendRequestsCount } = usePendingFriendRequests({ 
    userId: profile?.id 
  });
  
  // Filtrar menú según roles y permisos del usuario
  const { filterMenuItems } = useMenuVisibility({ userRoles });
  
  // En móvil siempre mostrar expandido, solo colapsar en desktop
  const isCollapsed = !isMobile && state === "collapsed";

  // Filtrar items según roles y permisos
  const visibleMenuItems = filterMenuItems(menuItems);

  // Función para cerrar el sidebar en móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };


  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className={cn(
          "flex items-center h-14",
          transitionClasses.normal,
          isCollapsed ? "justify-center px-0" : "justify-between px-2"
        )}>
          {isCollapsed ? (
            <SidebarTrigger className={cn(
              "text-sidebar-foreground h-8 w-8",
              transitionClasses.colors,
              hoverClasses.bgAccent
            )} />
          ) : (
            <>
              <NavLink 
                to="/bienvenida" 
                className={cn("flex items-center gap-2", transitionClasses.normal, hoverClasses.opacity)}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-primary",
                  transitionClasses.transform,
                  "hover:scale-105"
                )}>
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-foreground">
                  UniAlerta UCE
                </span>
              </NavLink>
              <SidebarTrigger className={cn(
                "text-sidebar-foreground",
                transitionClasses.colors,
                hoverClasses.bgAccent
              )} />
            </>
          )}
        </div>
      </SidebarHeader>

      {/* Menu Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item, index) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem 
                    key={item.title}
                    className={getStaggerClass(index, 30)}
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={transitionClasses.colors}
                    >
                      <NavLink
                        to={item.url}
                        onClick={handleLinkClick}
                        className={cn(
                          "flex items-center gap-3 relative",
                          transitionClasses.colors,
                          isActive && "text-primary font-medium"
                        )}
                      >
                        <div className="relative">
                          <item.icon className={cn(
                            "h-4 w-4",
                            transitionClasses.colors,
                            isActive && "text-primary"
                          )} />
                          {/* Badge en icono cuando colapsado - Notificaciones */}
                          {item.title === "Notificaciones" && notificationCount > 0 && isCollapsed && (
                            <Badge
                              variant="destructive"
                              className={cn(
                                "absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 text-[10px] flex items-center justify-center",
                                "animate-pulse"
                              )}
                            >
                              {notificationCount > 9 ? "9+" : notificationCount}
                            </Badge>
                          )}
                          {/* Badge en icono cuando colapsado - Solicitudes de amistad */}
                          {item.title === "Red Social" && friendRequestsCount > 0 && isCollapsed && (
                            <Badge
                              className={cn(
                                "absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 text-[10px] flex items-center justify-center",
                                "bg-primary text-primary-foreground animate-pulse"
                              )}
                            >
                              {friendRequestsCount > 9 ? "9+" : friendRequestsCount}
                            </Badge>
                          )}
                        </div>
                        <span>{item.title}</span>
                        {/* Badge normal cuando expandido - Notificaciones */}
                        {item.title === "Notificaciones" && notificationCount > 0 && !isCollapsed && (
                          <Badge
                            variant="destructive"
                            className={cn(
                              "ml-auto h-5 min-w-5 rounded-full px-1.5 text-xs",
                              "animate-pulse"
                            )}
                          >
                            {notificationCount}
                          </Badge>
                        )}
                        {/* Badge normal cuando expandido - Solicitudes de amistad con HoverCard */}
                        {item.title === "Red Social" && friendRequestsCount > 0 && !isCollapsed && (
                          <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <Badge
                                className={cn(
                                  "ml-auto h-5 min-w-5 rounded-full px-1.5 text-xs cursor-pointer",
                                  "bg-primary text-primary-foreground animate-pulse"
                                )}
                              >
                                {friendRequestsCount}
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent 
                              side="right" 
                              align="start" 
                              className="w-72 p-3"
                              sideOffset={8}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Solicitudes pendientes
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {friendRequestsCount} {friendRequestsCount === 1 ? 'solicitud' : 'solicitudes'}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {pendingRequests.slice(0, 3).map((request) => (
                                    <div 
                                      key={request.id} 
                                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={request.sender.avatar || undefined} />
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                          {request.sender.name?.charAt(0) || request.sender.username?.charAt(0) || '?'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <p className="text-sm font-medium text-foreground truncate">
                                            {request.sender.name || request.sender.username || 'Usuario'}
                                          </p>
                                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(request.created_at), { 
                                              addSuffix: true, 
                                              locale: es 
                                            })}
                                          </span>
                                        </div>
                                        {request.sender.username && request.sender.name && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            @{request.sender.username}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {friendRequestsCount > 3 && (
                                    <p className="text-xs text-center text-muted-foreground pt-1">
                                      +{friendRequestsCount - 3} más
                                    </p>
                                  )}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Menu Component */}
      <SidebarFooter className="border-t border-sidebar-border">
        <UserMenu isCollapsed={isCollapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}
