import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Vehicle, insertVehicleSchema } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';

import Navbar from '../components/Navbar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Plus, Car, Edit, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form schema for adding/editing vehicles
const vehicleFormSchema = insertVehicleSchema.extend({
  nickname: z.string().min(2, {
    message: 'Nickname must be at least 2 characters',
  }),
  licensePlate: z.string().min(2, {
    message: 'License plate is required',
  }),
  vehicleType: z.string().min(2, {
    message: 'Vehicle type is required',
  }),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

const Vehicles = () => {
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return <></>;
  }

  // Set up form with react-hook-form
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      nickname: '',
      licensePlate: '',
      vehicleType: '',
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  // Mutation for adding a vehicle
  const { mutate: addVehicle, isPending: isAddingVehicle } = useMutation({
    mutationFn: async (newVehicle: VehicleFormValues) => {
      const response = await apiRequest('POST', '/api/vehicles', newVehicle);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: 'Vehicle Added',
        description: 'Your vehicle has been added successfully.',
      });
      setIsAddVehicleOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Add Vehicle',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });

  // Mutation for updating a vehicle
  const { mutate: updateVehicle, isPending: isUpdatingVehicle } = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Vehicle> }) => {
      const response = await apiRequest('PATCH', `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: 'Vehicle Updated',
        description: 'Your vehicle has been updated successfully.',
      });
      setIsAddVehicleOpen(false);
      setEditingVehicle(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Update Vehicle',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });

  // Mutation for deleting a vehicle
  const { mutate: deleteVehicle, isPending: isDeletingVehicle } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vehicles/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: 'Vehicle Deleted',
        description: 'Your vehicle has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Delete Vehicle',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: VehicleFormValues) => {
    if (editingVehicle) {
      updateVehicle({ id: editingVehicle.id, data: values });
    } else {
      addVehicle(values);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    form.reset({
      nickname: vehicle.nickname || "",
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.vehicleType,
    });
    setIsAddVehicleOpen(true);
  };

  // Handle delete vehicle
  const handleDeleteVehicle = (id: number) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(id);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddVehicleOpen(false);
    setEditingVehicle(null);
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Vehicles</h1>
          <Button onClick={() => setIsAddVehicleOpen(true)} className="gap-2">
            <Plus size={16} />
            Add Vehicle
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <div className="animate-pulse text-center">
                <div className="h-6 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
          ) : vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-gray-50">
                  <CardTitle className="flex items-center">
                    <Car className="mr-2 h-5 w-5 text-primary" />
                    {vehicle.nickname}
                  </CardTitle>
                  <CardDescription>{vehicle.vehicleType}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">License Plate:</span>
                      <span className="ml-2">{vehicle.licensePlate}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2 border-t bg-gray-50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleEditVehicle(vehicle)}
                  >
                    <Edit size={14} />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    disabled={isDeletingVehicle}
                  >
                    <Trash size={14} />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Alert>
                <AlertDescription>
                  You haven't added any vehicles yet. Add your first vehicle to start booking parking spots.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add a New Vehicle'}</DialogTitle>
            <DialogDescription>
              {editingVehicle 
                ? 'Update your vehicle information below.' 
                : 'Add your vehicle details to easily book parking spaces.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="My Sedan" {...field} />
                    </FormControl>
                    <FormDescription>
                      A name to help you identify this vehicle.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Sedan, SUV, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isAddingVehicle || isUpdatingVehicle}
                >
                  {isAddingVehicle || isUpdatingVehicle 
                    ? 'Saving...' 
                    : editingVehicle 
                      ? 'Update Vehicle' 
                      : 'Add Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vehicles;