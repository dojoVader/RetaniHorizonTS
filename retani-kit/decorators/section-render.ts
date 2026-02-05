export function sectionRender(sectionId: string) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function () {
            try {
                const response = await fetch(`/?section_id=${sectionId}`);
                const html = await response.text();
                return originalMethod.call(this, html);
            } catch (error) {
                console.error('Section rendering failed:', error);
            }
        };
    };
}