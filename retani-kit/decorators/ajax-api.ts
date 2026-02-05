export function ajaxApi(url: string, method: 'GET' | 'POST' = 'GET') {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: method === 'POST' ? JSON.stringify(args[0]) : undefined,
                });
                const data = await response.json();
                return originalMethod.call(this, data);
            } catch (error) {
                console.error('Ajax API request failed:', error);
            }
        };
    };
}