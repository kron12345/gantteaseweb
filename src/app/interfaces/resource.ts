export interface StaffResource {
    id: number;
    name: string;
    firstName: string;
    attributes: {
        [key: string]: string | number | boolean;
    };
}

export interface VehicleResource {
    id: number;
    name: string;
    attributes: {
        [key: string]: string | number | boolean;
    };
}

export type Resource = StaffResource | VehicleResource;