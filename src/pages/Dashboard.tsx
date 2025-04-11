import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronUp, Users, Briefcase, GraduationCap, TrendingUp, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getUserCandidates } from '@/services/candidateService';
import { CandidateData } from '@/services/data/candidateService';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  PopoverClose,
} from "@/components/ui/popover"
import { CalendarDateRangePicker } from "@/components/ui/calendar"
import { useForm } from 'react-hook-form';
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FormDescription,
} from "@/components/ui/form"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Progress
} from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CardFooter,
} from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  CommandDialog,
  CommandList as CommandList2,
  CommandInput as CommandInput2,
  CommandItem as CommandItem2,
} from "@/components/ui/command"
import {
  AspectRatio,
} from "@/components/ui/aspect-ratio"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel"
import {
  ScrollArea,
} from "@/components/ui/scroll-area"
import {
  ResizableHandle as ResizableHandle2,
  ResizablePanel as ResizablePanel2,
  ResizablePanelGroup as ResizablePanelGroup2,
  ResizableSeparator as ResizableSeparator2,
} from "@/components/ui/resizable"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu as DropdownMenu2,
  DropdownMenuContent as DropdownMenuContent2,
  DropdownMenuItem as DropdownMenuItem2,
  DropdownMenuLabel as DropdownMenuLabel2,
  DropdownMenuSeparator as DropdownMenuSeparator2,
  DropdownMenuTrigger as DropdownMenuTrigger2,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Calendar as Calendar2
} from "@/components/ui/calendar"
import {
  Card as Card2,
  CardContent as CardContent2,
  CardDescription as CardDescription2,
  CardFooter as CardFooter2,
  CardHeader as CardHeader2,
  CardTitle as CardTitle2,
} from "@/components/ui/card"
import {
  Checkbox,
} from "@/components/ui/checkbox"
import {
  Command as Command3,
  CommandDialog as CommandDialog3,
  CommandEmpty as CommandEmpty3,
  CommandGroup as CommandGroup3,
  CommandInput as CommandInput3,
  CommandItem as CommandItem3,
  CommandList as CommandList3,
  CommandSeparator as CommandSeparator3,
  CommandShortcut as CommandShortcut3,
} from "@/components/ui/command"
import {
  ContextMenu as ContextMenu3,
  ContextMenuCheckboxItem as ContextMenuCheckboxItem3,
  ContextMenuContent as ContextMenuContent3,
  ContextMenuItem as ContextMenuItem3,
  ContextMenuLabel as ContextMenuLabel3,
  ContextMenuRadioGroup as ContextMenuRadioGroup3,
  ContextMenuRadioItem as ContextMenuRadioItem3,
  ContextMenuSeparator as ContextMenuSeparator3,
  ContextMenuSub as ContextMenuSub3,
  ContextMenuSubContent as ContextMenuSubContent3,
  ContextMenuSubTrigger as ContextMenuSubTrigger3,
  ContextMenuTrigger as ContextMenuTrigger3,
} from "@/components/ui/context-menu"
import {
  Dialog as Dialog3,
  DialogContent as DialogContent3,
  DialogDescription as DialogDescription3,
  DialogFooter as DialogFooter3,
  DialogHeader as DialogHeader3,
  DialogTitle as DialogTitle3,
  DialogTrigger as DialogTrigger3,
} from "@/components/ui/dialog"
import {
  DropdownMenu as DropdownMenu4,
  DropdownMenuContent as DropdownMenuContent4,
  DropdownMenuItem as DropdownMenuItem4,
  DropdownMenuLabel as DropdownMenuLabel4,
  DropdownMenuSeparator as DropdownMenuSeparator4,
  DropdownMenuTrigger as DropdownMenuTrigger4,
} from "@/components/ui/dropdown-menu"
import {
  Form as Form4,
  FormControl as FormControl4,
  FormDescription as FormDescription4,
  FormField as FormField4,
  FormItem as FormItem4,
  FormLabel as FormLabel4,
  FormMessage as FormMessage4,
} from "@/components/ui/form"
import {
  HoverCard as HoverCard4,
  HoverCardContent as HoverCardContent4,
  HoverCardTrigger as HoverCardTrigger4,
} from "@/components/ui/hover-card"
import {
  Input as Input4,
} from "@/components/ui/input"
import {
  Label as Label4,
} from "@/components/ui/label"
import {
  Menubar as Menubar4,
  MenubarCheckboxItem as MenubarCheckboxItem4,
  MenubarContent as MenubarContent4,
  MenubarItem as MenubarItem4,
  MenubarMenu as MenubarMenu4,
  MenubarRadioGroup as MenubarRadioGroup4,
  MenubarRadioItem as MenubarRadioItem4,
  MenubarSeparator as MenubarSeparator4,
  MenubarShortcut as MenubarShortcut4,
  MenubarSub as MenubarSub4,
  MenubarSubContent as MenubarSubContent4,
  MenubarSubTrigger as MenubarSubTrigger4,
  MenubarTrigger as MenubarTrigger4,
} from "@/components/ui/menubar"
import {
  Popover as Popover4,
  PopoverClose as PopoverClose4,
  PopoverContent as PopoverContent4,
  PopoverTrigger as PopoverTrigger4,
} from "@/components/ui/popover"
import {
  Progress as Progress4,
} from "@/components/ui/progress"
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import {
  ResizableHandle as ResizableHandle4,
  ResizablePanel as ResizablePanel4,
  ResizablePanelGroup as ResizablePanelGroup4,
  ResizableSeparator as ResizableSeparator4,
} from "@/components/ui/resizable"
import {
  ScrollArea as ScrollArea4,
} from "@/components/ui/scroll-area"
import {
  Select as Select4,
  SelectContent as SelectContent4,
  SelectItem as SelectItem4,
  SelectTrigger as SelectTrigger4,
  SelectValue as SelectValue4,
} from "@/components/ui/select"
import {
  Separator as Separator4,
} from "@/components/ui/separator"
import {
  Sheet as Sheet4,
  SheetClose as SheetClose4,
  SheetContent as SheetContent4,
  SheetDescription as SheetDescription4,
  SheetFooter as SheetFooter4,
  SheetHeader as SheetHeader4,
  SheetTitle as SheetTitle4,
  SheetTrigger as SheetTrigger4,
} from "@/components/ui/sheet"
import {
  Skeleton as Skeleton4,
} from "@/components/ui/skeleton"
import {
  Table as Table4,
  TableBody as TableBody4,
  TableCaption as TableCaption4,
  TableCell as TableCell4,
  TableFooter as TableFooter4,
  TableHead as TableHead4,
  TableHeader as TableHeader4,
  TableRow as TableRow4,
} from "@/components/ui/table"
import {
  Textarea,
} from "@/components/ui/textarea"
import {
  Tooltip as Tooltip4,
  TooltipContent as TooltipContent4,
  TooltipProvider as TooltipProvider4,
  TooltipTrigger as TooltipTrigger4,
} from "@/components/ui/tooltip"
import {
  useFormField,
} from "@/components/ui/form"
import {
  useCarousel as useCarousel4,
} from "@/components/ui/carousel"
import {
  useDialog,
} from "@/components/ui/dialog"
import {
  useDrawer,
} from "@/components/ui/drawer"
import {
  useHoverCard,
} from "@/components/ui/hover-card"
import {
  useMenu,
} from "@/components/ui/menu"
import {
  useOptionalContext,
} from "@/components/ui/use-optional-context"
import {
  usePopover,
} from "@/components/ui/popover"
import {
  useSheet,
} from "@/components/ui/sheet"
import {
  useToast as useToast4,
} from "@/components/ui/use-toast"
import {
  useTooltip,
} from "@/components/ui/tooltip"
import {
  useTransitionStatus,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext,
} from "@/components/ui/accordion"
import {
  useCollapsibleContext,
} from "@/components/ui/collapsible"
import {
  useContextMenuContext,
} from "@/components/ui/context-menu"
import {
  useDropdownMenuContext,
} from "@/components/ui/dropdown-menu"
import {
  useMenubarContext,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext,
} from "@/components/ui/navigation-menu"
import {
  useRadioGroupContext,
} from "@/components/ui/radio-group"
import {
  useResizableContext,
} from "@/components/ui/resizable"
import {
  useSelectContext,
} from "@/components/ui/select"
import {
  useTableContext,
} from "@/components/ui/table"
import {
  useAlertDialog,
} from "@/components/ui/alert-dialog"
import {
  useCommand,
} from "@/components/ui/command"
import {
  useFormStatus,
} from "@/components/ui/form"
import {
  useFormField as useFormField4,
} from "@/components/ui/form"
import {
  useToast as useToast5,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus4,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext4,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog4,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel5,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext4,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand4,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext4,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog4,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer4,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext4,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus4,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard4,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu4,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext4,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext4,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext4,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover5,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext4,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext4,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext4,
} from "@/components/ui/select"
import {
  useSheet as useSheet5,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext4,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip5,
} from "@/components/ui/tooltip"
import {
  useToast as useToast6,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus5,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext5,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog5,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel6,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext5,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand5,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext5,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog5,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer5,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext5,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus5,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard5,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu5,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext5,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext5,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext5,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover6,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext5,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext5,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext5,
} from "@/components/ui/select"
import {
  useSheet as useSheet6,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext5,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip6,
} from "@/components/ui/tooltip"
import {
  useToast as useToast7,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus6,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext6,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog6,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel7,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext6,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand6,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext6,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog6,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer6,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext6,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus6,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard6,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu6,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext6,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext6,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext6,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover7,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext6,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext6,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext6,
} from "@/components/ui/select"
import {
  useSheet as useSheet7,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext6,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip7,
} from "@/components/ui/tooltip"
import {
  useToast as useToast8,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus7,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext7,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog7,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel8,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext7,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand7,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext7,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog7,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer7,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext7,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus7,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard7,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu7,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext7,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext7,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext7,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover8,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext7,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext7,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext7,
} from "@/components/ui/select"
import {
  useSheet as useSheet8,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext7,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip8,
} from "@/components/ui/tooltip"
import {
  useToast as useToast9,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus8,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext8,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog8,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel9,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext8,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand8,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext8,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog8,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer8,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext8,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus8,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard8,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu8,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext8,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext8,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext8,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover9,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext8,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext8,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext8,
} from "@/components/ui/select"
import {
  useSheet as useSheet9,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext8,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip9,
} from "@/components/ui/tooltip"
import {
  useToast as useToast10,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus9,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext9,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog9,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel10,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext9,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand9,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext9,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog9,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer9,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext9,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus9,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard9,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu9,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext9,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext9,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext9,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover10,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext9,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext9,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext9,
} from "@/components/ui/select"
import {
  useSheet as useSheet10,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext9,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip10,
} from "@/components/ui/tooltip"
import {
  useToast as useToast11,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus10,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext10,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog10,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel11,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext10,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand10,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext10,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog10,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer10,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext10,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus10,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard10,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu10,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext10,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext10,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext10,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover11,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext10,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext10,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext10,
} from "@/components/ui/select"
import {
  useSheet as useSheet11,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext10,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip11,
} from "@/components/ui/tooltip"
import {
  useToast as useToast12,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus11,
} from "@/components/ui/use-transition-status"
import {
  useAccordionContext as useAccordionContext11,
} from "@/components/ui/accordion"
import {
  useAlertDialog as useAlertDialog11,
} from "@/components/ui/alert-dialog"
import {
  useCarousel as useCarousel12,
} from "@/components/ui/carousel"
import {
  useCollapsibleContext as useCollapsibleContext11,
} from "@/components/ui/collapsible"
import {
  useCommand as useCommand11,
} from "@/components/ui/command"
import {
  useContextMenuContext as useContextMenuContext11,
} from "@/components/ui/context-menu"
import {
  useDialog as useDialog11,
} from "@/components/ui/dialog"
import {
  useDrawer as useDrawer11,
} from "@/components/ui/drawer"
import {
  useDropdownMenuContext as useDropdownMenuContext11,
} from "@/components/ui/dropdown-menu"
import {
  useFormStatus as useFormStatus11,
} from "@/components/ui/form"
import {
  useHoverCard as useHoverCard11,
} from "@/components/ui/hover-card"
import {
  useMenu as useMenu11,
} from "@/components/ui/menu"
import {
  useMenubarContext as useMenubarContext11,
} from "@/components/ui/menubar"
import {
  useNavigationMenuContext as useNavigationMenuContext11,
} from "@/components/ui/navigation-menu"
import {
  useOptionalContext as useOptionalContext11,
} from "@/components/ui/use-optional-context"
import {
  usePopover as usePopover12,
} from "@/components/ui/popover"
import {
  useRadioGroupContext as useRadioGroupContext11,
} from "@/components/ui/radio-group"
import {
  useResizableContext as useResizableContext11,
} from "@/components/ui/resizable"
import {
  useSelectContext as useSelectContext11,
} from "@/components/ui/select"
import {
  useSheet as useSheet12,
} from "@/components/ui/sheet"
import {
  useTableContext as useTableContext11,
} from "@/components/ui/table"
import {
  useTooltip as useTooltip12,
} from "@/components/ui/tooltip"
import {
  useToast as useToast13,
} from "@/components/ui/use-toast"
import {
  useTransitionStatus as useTransitionStatus12,
} from "@/components/ui/use-transition-status"
import {
