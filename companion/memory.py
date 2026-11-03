"""Host RAM capacity reporting and conservative guest memory planning."""
import ctypes
import os
import platform

MIB=1024*1024
MAX_MIB=65536
RESERVE_MIB=4096

def host_memory_mib():
    if platform.system()=="Windows":
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_=[("dwLength",ctypes.c_ulong),("dwMemoryLoad",ctypes.c_ulong),
                     ("ullTotalPhys",ctypes.c_ulonglong),("ullAvailPhys",ctypes.c_ulonglong),
                     ("ullTotalPageFile",ctypes.c_ulonglong),("ullAvailPageFile",ctypes.c_ulonglong),
                     ("ullTotalVirtual",ctypes.c_ulonglong),("ullAvailVirtual",ctypes.c_ulonglong),
                     ("ullAvailExtendedVirtual",ctypes.c_ulonglong)]
        m=MEMORYSTATUSEX()
        m.dwLength=ctypes.sizeof(m)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m)):
            raise OSError("Cannot read system memory")
        return {"totalMiB":m.ullTotalPhys//MIB,"availableMiB":m.ullAvailPhys//MIB}
    if os.path.isfile("/proc/meminfo"):
        data={}
        with open("/proc/meminfo",encoding="ascii") as f:
            for line in f:
                key,_,value=line.partition(":")
                if key in ("MemTotal","MemAvailable"):
                    data[key]=int(value.strip().split()[0])//1024
        if len(data)==2:
            return {"totalMiB":data["MemTotal"],"availableMiB":data["MemAvailable"]}
    return {"totalMiB":None,"availableMiB":None}

def plan_memory(requested_mib):
    if isinstance(requested_mib,bool) or not isinstance(requested_mib,int) or requested_mib<128 or requested_mib>MAX_MIB:
        raise ValueError("RAM must be between 128 MiB and 65536 MiB")
    host=host_memory_mib()
    available=host["availableMiB"]
    safe=max(0,available-RESERVE_MIB) if available is not None else None
    allowed=safe is not None and requested_mib<=safe
    return {**host,"requestedMiB":requested_mib,"maxSupportedMiB":MAX_MIB,
            "hostReserveMiB":RESERVE_MIB,"safeBudgetMiB":safe,"fitsAvailableMemory":allowed,
            "allocated":False,"backend":"native-companion-required",
            "reason":"Capacity check only; no VM memory is allocated."}
